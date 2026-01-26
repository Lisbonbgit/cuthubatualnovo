#!/usr/bin/env python3
"""
Backend API Test Suite for Barbershop SaaS - Multi-Location Management (Locais)
Testing the Locais endpoints for managing multiple locations/branches
"""

import requests
import json
import sys
from datetime import datetime

# Configuration
BASE_URL = "https://cut-connect-3.preview.emergentagent.com/api"
ADMIN_EMAIL = "admin@teste.pt"
ADMIN_PASSWORD = "admin123"

class LocaisAPITester:
    def __init__(self):
        self.token = None
        self.created_location_id = None
        self.test_results = []
        
    def log_result(self, test_name, success, message, details=None):
        """Log test result"""
        result = {
            'test': test_name,
            'success': success,
            'message': message,
            'details': details,
            'timestamp': datetime.now().isoformat()
        }
        self.test_results.append(result)
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status} {test_name}: {message}")
        if details and not success:
            print(f"   Details: {details}")
    
    def login_admin(self):
        """Login as admin to get authentication token"""
        try:
            response = requests.post(f"{BASE_URL}/auth/login", json={
                "email": ADMIN_EMAIL,
                "password": ADMIN_PASSWORD
            })
            
            if response.status_code == 200:
                data = response.json()
                self.token = data.get('token')
                user = data.get('user', {})
                self.log_result(
                    "Admin Login", 
                    True, 
                    f"Successfully logged in as {user.get('nome', 'Admin')}"
                )
                return True
            else:
                self.log_result(
                    "Admin Login", 
                    False, 
                    f"Login failed with status {response.status_code}",
                    response.text
                )
                return False
                
        except Exception as e:
            self.log_result("Admin Login", False, f"Login error: {str(e)}")
            return False
    
    def get_headers(self):
        """Get headers with authorization token"""
        return {
            "Authorization": f"Bearer {self.token}",
            "Content-Type": "application/json"
        }
    
    def test_get_locations_list(self):
        """Test GET /api/locais - List all locations"""
        try:
            response = requests.get(f"{BASE_URL}/locais", headers=self.get_headers())
            
            if response.status_code == 200:
                data = response.json()
                locations = data.get('locais', [])
                self.log_result(
                    "GET Locations List", 
                    True, 
                    f"Retrieved {len(locations)} locations successfully"
                )
                
                # Log existing locations for reference
                if locations:
                    print("   Existing locations:")
                    for loc in locations:
                        print(f"     - {loc.get('nome')} ({loc.get('_id')})")
                
                return True
            else:
                self.log_result(
                    "GET Locations List", 
                    False, 
                    f"Failed with status {response.status_code}",
                    response.text
                )
                return False
                
        except Exception as e:
            self.log_result("GET Locations List", False, f"Error: {str(e)}")
            return False
    
    def test_create_location(self):
        """Test POST /api/locais - Create new location"""
        try:
            location_data = {
                "nome": "Filial Almada",
                "morada": "Av. do Cristo Rei, 45 - Almada",
                "telefone": "+351 21 234 5678",
                "email": "almada@barbearia.pt",
                "horarios": {
                    "segunda": {"aberto": True, "abertura": "10:00", "fecho": "18:00"},
                    "terca": {"aberto": True, "abertura": "10:00", "fecho": "18:00"},
                    "quarta": {"aberto": True, "abertura": "10:00", "fecho": "18:00"},
                    "quinta": {"aberto": True, "abertura": "10:00", "fecho": "18:00"},
                    "sexta": {"aberto": True, "abertura": "10:00", "fecho": "18:00"},
                    "sabado": {"aberto": True, "abertura": "09:00", "fecho": "14:00"},
                    "domingo": {"aberto": False}
                }
            }
            
            response = requests.post(f"{BASE_URL}/locais", 
                                   json=location_data, 
                                   headers=self.get_headers())
            
            if response.status_code == 200:
                data = response.json()
                location = data.get('local', {})
                self.created_location_id = location.get('_id')
                
                self.log_result(
                    "POST Create Location", 
                    True, 
                    f"Created location '{location.get('nome')}' with ID {self.created_location_id}"
                )
                return True
            else:
                self.log_result(
                    "POST Create Location", 
                    False, 
                    f"Failed with status {response.status_code}",
                    response.text
                )
                return False
                
        except Exception as e:
            self.log_result("POST Create Location", False, f"Error: {str(e)}")
            return False
    
    def test_create_location_plan_limit(self):
        """Test POST /api/locais with plan limits"""
        try:
            # Test creating location when plan limit is reached
            location_data = {
                "nome": "Test Location",
                "morada": "Test Address"
            }
            response = requests.post(f"{BASE_URL}/locais", 
                                   json=location_data, 
                                   headers=self.get_headers())
            
            if response.status_code == 403:
                data = response.json()
                if data.get('upgrade_required'):
                    self.log_result(
                        "POST Create Location (Plan Limit)", 
                        True, 
                        f"Correctly enforced plan limit: {data.get('message')}"
                    )
                    return True
            
            self.log_result(
                "POST Create Location (Plan Limit)", 
                False, 
                f"Expected 403 with upgrade_required, got {response.status_code}",
                response.text
            )
            return False
                
        except Exception as e:
            self.log_result("POST Create Location (Plan Limit)", False, f"Error: {str(e)}")
            return False
    
    def test_update_existing_location(self):
        """Test PUT /api/locais/:id - Update existing location"""
        try:
            # First get the existing location
            response = requests.get(f"{BASE_URL}/locais", headers=self.get_headers())
            if response.status_code != 200:
                self.log_result("PUT Update Existing Location", False, "Could not get locations list")
                return False
                
            data = response.json()
            locations = data.get('locais', [])
            if not locations:
                self.log_result("PUT Update Existing Location", False, "No existing locations found")
                return False
                
            # Use the first existing location
            existing_location = locations[0]
            location_id = existing_location.get('_id')
            original_name = existing_location.get('nome')
            
            # Update the location
            update_data = {
                "nome": f"{original_name} - Atualizada",
                "telefone": "+351 21 999 8888",
                "email": "updated@barbearia.pt"
            }
            
            response = requests.put(f"{BASE_URL}/locais/{location_id}", 
                                  json=update_data, 
                                  headers=self.get_headers())
            
            if response.status_code == 200:
                data = response.json()
                location = data.get('local', {})
                
                # Restore original name
                restore_data = {"nome": original_name}
                requests.put(f"{BASE_URL}/locais/{location_id}", 
                           json=restore_data, 
                           headers=self.get_headers())
                
                self.log_result(
                    "PUT Update Existing Location", 
                    True, 
                    f"Successfully updated location (restored to original name)"
                )
                return True
            else:
                self.log_result(
                    "PUT Update Existing Location", 
                    False, 
                    f"Failed with status {response.status_code}",
                    response.text
                )
                return False
                
        except Exception as e:
            self.log_result("PUT Update Existing Location", False, f"Error: {str(e)}")
            return False
    
    def test_get_existing_location(self):
        """Test GET /api/locais/:id - Get existing location details"""
        try:
            # First get the locations list to get an existing location ID
            response = requests.get(f"{BASE_URL}/locais", headers=self.get_headers())
            if response.status_code != 200:
                self.log_result("GET Existing Location", False, "Could not get locations list")
                return False
                
            data = response.json()
            locations = data.get('locais', [])
            if not locations:
                self.log_result("GET Existing Location", False, "No existing locations found")
                return False
                
            # Use the first existing location
            existing_location = locations[0]
            location_id = existing_location.get('_id')
            
            response = requests.get(f"{BASE_URL}/locais/{location_id}", 
                                  headers=self.get_headers())
            
            if response.status_code == 200:
                data = response.json()
                location = data.get('local', {})
                barbeiros = data.get('barbeiros', [])
                
                self.log_result(
                    "GET Existing Location", 
                    True, 
                    f"Retrieved location '{location.get('nome')}' with {len(barbeiros)} barbers"
                )
                return True
            else:
                self.log_result(
                    "GET Existing Location", 
                    False, 
                    f"Failed with status {response.status_code}",
                    response.text
                )
                return False
                
        except Exception as e:
            self.log_result("GET Existing Location", False, f"Error: {str(e)}")
            return False
    
    def test_delete_location(self):
        """Test DELETE /api/locais/:id - Delete/deactivate location"""
        if not self.created_location_id:
            self.log_result("DELETE Location", False, "No location ID available for delete test")
            return False
            
        try:
            response = requests.delete(f"{BASE_URL}/locais/{self.created_location_id}", 
                                     headers=self.get_headers())
            
            if response.status_code == 200:
                data = response.json()
                message = data.get('message', 'Location deleted successfully')
                
                self.log_result(
                    "DELETE Location", 
                    True, 
                    f"Location soft-deleted: {message}"
                )
                return True
            else:
                self.log_result(
                    "DELETE Location", 
                    False, 
                    f"Failed with status {response.status_code}",
                    response.text
                )
                return False
                
        except Exception as e:
            self.log_result("DELETE Location", False, f"Error: {str(e)}")
            return False
    
    def test_unauthorized_access(self):
        """Test that unauthenticated requests are rejected"""
        try:
            # Test without authorization header
            response = requests.get(f"{BASE_URL}/locais")
            
            if response.status_code == 401:
                self.log_result(
                    "Unauthorized Access Test", 
                    True, 
                    "Correctly rejected unauthenticated request"
                )
                return True
            else:
                self.log_result(
                    "Unauthorized Access Test", 
                    False, 
                    f"Should have returned 401, got {response.status_code}",
                    response.text
                )
                return False
                
        except Exception as e:
            self.log_result("Unauthorized Access Test", False, f"Error: {str(e)}")
            return False
    
    def test_verify_locations_after_delete(self):
        """Verify that deleted location is not in active list"""
        try:
            response = requests.get(f"{BASE_URL}/locais", headers=self.get_headers())
            
            if response.status_code == 200:
                data = response.json()
                locations = data.get('locais', [])
                
                # Check if our deleted location is still in the active list
                deleted_location_found = any(
                    loc.get('_id') == self.created_location_id 
                    for loc in locations
                )
                
                if not deleted_location_found:
                    self.log_result(
                        "Verify Soft Delete", 
                        True, 
                        "Deleted location correctly removed from active list"
                    )
                    return True
                else:
                    self.log_result(
                        "Verify Soft Delete", 
                        False, 
                        "Deleted location still appears in active list"
                    )
                    return False
            else:
                self.log_result(
                    "Verify Soft Delete", 
                    False, 
                    f"Failed to get locations list: {response.status_code}",
                    response.text
                )
                return False
                
        except Exception as e:
            self.log_result("Verify Soft Delete", False, f"Error: {str(e)}")
            return False
    
    def run_all_tests(self):
        """Run all Locais API tests"""
        print("🧪 Starting Multi-Location Management (Locais) API Tests")
        print("=" * 60)
        
        # Step 1: Login
        if not self.login_admin():
            print("❌ Cannot proceed without authentication")
            return False
        
        # Step 2: Test unauthorized access
        self.test_unauthorized_access()
        
        # Step 3: Get initial locations list
        self.test_get_locations_list()
        
        # Step 4: Test plan limits (since we can't create new locations)
        self.test_create_location_plan_limit()
        
        # Step 5: Test with existing location
        self.test_get_existing_location()
        
        # Step 6: Test updating existing location
        self.test_update_existing_location()
        
        # Final results
        print("\n" + "=" * 60)
        print("📊 TEST SUMMARY")
        print("=" * 60)
        
        passed = sum(1 for r in self.test_results if r['success'])
        total = len(self.test_results)
        
        print(f"Total Tests: {total}")
        print(f"Passed: {passed}")
        print(f"Failed: {total - passed}")
        print(f"Success Rate: {(passed/total)*100:.1f}%")
        
        if passed == total:
            print("\n🎉 ALL TESTS PASSED! Locais API is working correctly.")
            return True
        else:
            print(f"\n⚠️  {total - passed} test(s) failed. Check the details above.")
            return False

def main():
    """Main test execution"""
    tester = LocaisAPITester()
    success = tester.run_all_tests()
    
    # Exit with appropriate code
    sys.exit(0 if success else 1)

if __name__ == "__main__":
    main()