#!/usr/bin/env python3
"""
Backend Testing for BarbePRO - Barber Management Functionality
Tests the following endpoints:
1. POST /api/barbeiros (Create barber with new fields)
2. PUT /api/barbeiros/{id} (Edit barber)
3. GET /api/barbeiros (List barbers)
4. PUT /api/marcacoes/{id} (Update booking status)
"""

import requests
import json
import sys
from datetime import datetime, timedelta

# Base URL from environment
BASE_URL = "https://fix-barber-repo.preview.emergentagent.com"
API_BASE = f"{BASE_URL}/api"

# Test credentials
ADMIN_CREDENTIALS = {
    "email": "admin@premium.pt",
    "password": "admin123"
}

BARBEIRO_CREDENTIALS = {
    "email": "joao@premium.pt", 
    "password": "barbeiro123"
}

class BarbePROTester:
    def __init__(self):
        self.admin_token = None
        self.barbeiro_token = None
        self.created_barbeiro_id = None
        self.test_marcacao_id = None
        
    def login(self, credentials, user_type="admin"):
        """Login and get JWT token"""
        try:
            print(f"🔐 Logging in as {user_type}...")
            response = requests.post(f"{API_BASE}/auth/login", json=credentials)
            
            if response.status_code == 200:
                data = response.json()
                token = data.get('token')
                user = data.get('user', {})
                print(f"✅ Login successful for {user.get('nome', 'Unknown')} ({user.get('tipo', 'Unknown')})")
                return token
            else:
                print(f"❌ Login failed: {response.status_code} - {response.text}")
                return None
                
        except Exception as e:
            print(f"❌ Login error: {str(e)}")
            return None
    
    def test_create_barbeiro(self):
        """Test POST /api/barbeiros - Create barber with new fields"""
        print("\n🧪 Testing POST /api/barbeiros (Create barber with new fields)")
        
        if not self.admin_token:
            print("❌ Admin token required for this test")
            return False
            
        # Test data with new fields
        barbeiro_data = {
            "nome": "Miguel Santos",
            "email": "miguel@premium.pt",
            "password": "barbeiro456",
            "telemovel": "+351 912 345 678",
            "biografia": "Especialista em cortes clássicos e modernos com 10 anos de experiência",
            "especialidades": ["Corte Clássico", "Barbear Tradicional", "Styling"]
        }
        
        try:
            headers = {"Authorization": f"Bearer {self.admin_token}"}
            response = requests.post(f"{API_BASE}/barbeiros", json=barbeiro_data, headers=headers)
            
            if response.status_code == 200:
                data = response.json()
                barbeiro = data.get('barbeiro', {})
                self.created_barbeiro_id = barbeiro.get('_id')
                
                # Verify all new fields are present
                required_fields = ['nome', 'email', 'telemovel', 'biografia', 'especialidades', 'ativo']
                missing_fields = [field for field in required_fields if field not in barbeiro]
                
                if missing_fields:
                    print(f"❌ Missing fields in response: {missing_fields}")
                    return False
                
                # Verify field values
                if barbeiro.get('telemovel') != barbeiro_data['telemovel']:
                    print(f"❌ Telemovel mismatch: expected {barbeiro_data['telemovel']}, got {barbeiro.get('telemovel')}")
                    return False
                    
                if barbeiro.get('biografia') != barbeiro_data['biografia']:
                    print(f"❌ Biografia mismatch")
                    return False
                    
                if barbeiro.get('especialidades') != barbeiro_data['especialidades']:
                    print(f"❌ Especialidades mismatch")
                    return False
                
                print(f"✅ Barbeiro created successfully with ID: {self.created_barbeiro_id}")
                print(f"   - Nome: {barbeiro.get('nome')}")
                print(f"   - Email: {barbeiro.get('email')}")
                print(f"   - Telemovel: {barbeiro.get('telemovel')}")
                print(f"   - Biografia: {barbeiro.get('biografia')[:50]}...")
                print(f"   - Especialidades: {barbeiro.get('especialidades')}")
                print(f"   - Ativo: {barbeiro.get('ativo')}")
                return True
                
            else:
                print(f"❌ Create barbeiro failed: {response.status_code} - {response.text}")
                return False
                
        except Exception as e:
            print(f"❌ Create barbeiro error: {str(e)}")
            return False
    
    def test_get_barbeiros(self):
        """Test GET /api/barbeiros - List barbers with new fields"""
        print("\n🧪 Testing GET /api/barbeiros (List barbers)")
        
        if not self.admin_token:
            print("❌ Admin token required for this test")
            return False
            
        try:
            headers = {"Authorization": f"Bearer {self.admin_token}"}
            response = requests.get(f"{API_BASE}/barbeiros", headers=headers)
            
            if response.status_code == 200:
                data = response.json()
                barbeiros = data.get('barbeiros', [])
                
                if not barbeiros:
                    print("❌ No barbeiros found")
                    return False
                
                print(f"✅ Found {len(barbeiros)} barbeiros")
                
                # Check if our created barbeiro is in the list
                created_barbeiro = None
                if self.created_barbeiro_id:
                    created_barbeiro = next((b for b in barbeiros if b.get('_id') == self.created_barbeiro_id), None)
                
                # Verify new fields are present in at least one barbeiro
                sample_barbeiro = created_barbeiro or barbeiros[0]
                required_fields = ['nome', 'email', 'telemovel', 'biografia', 'especialidades', 'ativo']
                
                for field in required_fields:
                    if field not in sample_barbeiro:
                        print(f"❌ Missing field '{field}' in barbeiro response")
                        return False
                
                print("✅ All required fields present in barbeiros list:")
                for barbeiro in barbeiros:
                    print(f"   - {barbeiro.get('nome')} ({barbeiro.get('email')})")
                    print(f"     Telemovel: {barbeiro.get('telemovel', 'N/A')}")
                    print(f"     Especialidades: {barbeiro.get('especialidades', [])}")
                    print(f"     Ativo: {barbeiro.get('ativo', True)}")
                
                return True
                
            else:
                print(f"❌ Get barbeiros failed: {response.status_code} - {response.text}")
                return False
                
        except Exception as e:
            print(f"❌ Get barbeiros error: {str(e)}")
            return False
    
    def test_update_barbeiro(self):
        """Test PUT /api/barbeiros/{id} - Edit barber"""
        print("\n🧪 Testing PUT /api/barbeiros/{id} (Edit barber)")
        
        if not self.admin_token:
            print("❌ Admin token required for this test")
            return False
            
        if not self.created_barbeiro_id:
            print("❌ No barbeiro ID available for update test")
            return False
            
        # Updated data
        update_data = {
            "nome": "Miguel Santos Silva",
            "email": "miguel.silva@premium.pt",
            "telemovel": "+351 913 456 789",
            "biografia": "Especialista em cortes clássicos, modernos e barbear tradicional com mais de 10 anos de experiência no setor",
            "especialidades": ["Corte Clássico", "Barbear Tradicional", "Styling", "Tratamentos Capilares"],
            "ativo": True
        }
        
        try:
            headers = {"Authorization": f"Bearer {self.admin_token}"}
            response = requests.put(f"{API_BASE}/barbeiros/{self.created_barbeiro_id}", json=update_data, headers=headers)
            
            if response.status_code == 200:
                data = response.json()
                barbeiro = data.get('barbeiro', {})
                
                # Verify updates
                if barbeiro.get('nome') != update_data['nome']:
                    print(f"❌ Nome not updated: expected {update_data['nome']}, got {barbeiro.get('nome')}")
                    return False
                    
                if barbeiro.get('email') != update_data['email']:
                    print(f"❌ Email not updated: expected {update_data['email']}, got {barbeiro.get('email')}")
                    return False
                    
                if barbeiro.get('telemovel') != update_data['telemovel']:
                    print(f"❌ Telemovel not updated")
                    return False
                    
                if barbeiro.get('biografia') != update_data['biografia']:
                    print(f"❌ Biografia not updated")
                    return False
                    
                if barbeiro.get('especialidades') != update_data['especialidades']:
                    print(f"❌ Especialidades not updated")
                    return False
                
                print("✅ Barbeiro updated successfully:")
                print(f"   - Nome: {barbeiro.get('nome')}")
                print(f"   - Email: {barbeiro.get('email')}")
                print(f"   - Telemovel: {barbeiro.get('telemovel')}")
                print(f"   - Biografia: {barbeiro.get('biografia')[:50]}...")
                print(f"   - Especialidades: {barbeiro.get('especialidades')}")
                print(f"   - Ativo: {barbeiro.get('ativo')}")
                return True
                
            else:
                print(f"❌ Update barbeiro failed: {response.status_code} - {response.text}")
                return False
                
        except Exception as e:
            print(f"❌ Update barbeiro error: {str(e)}")
            return False
    
    def test_update_barbeiro_password(self):
        """Test PUT /api/barbeiros/{id} - Update password"""
        print("\n🧪 Testing PUT /api/barbeiros/{id} (Update password)")
        
        if not self.admin_token or not self.created_barbeiro_id:
            print("❌ Admin token and barbeiro ID required for this test")
            return False
            
        # Test password update
        password_data = {
            "nome": "Miguel Santos Silva",
            "email": "miguel.silva@premium.pt",
            "telemovel": "+351 913 456 789",
            "biografia": "Especialista em cortes clássicos, modernos e barbear tradicional com mais de 10 anos de experiência no setor",
            "especialidades": ["Corte Clássico", "Barbear Tradicional", "Styling", "Tratamentos Capilares"],
            "ativo": True,
            "password": "newpassword123"
        }
        
        try:
            headers = {"Authorization": f"Bearer {self.admin_token}"}
            response = requests.put(f"{API_BASE}/barbeiros/{self.created_barbeiro_id}", json=password_data, headers=headers)
            
            if response.status_code == 200:
                print("✅ Password update successful (password field should be hashed and not returned)")
                data = response.json()
                barbeiro = data.get('barbeiro', {})
                
                # Verify password is not in response
                if 'password' in barbeiro:
                    print("❌ Password field should not be returned in response")
                    return False
                    
                print("✅ Password field correctly excluded from response")
                return True
                
            else:
                print(f"❌ Password update failed: {response.status_code} - {response.text}")
                return False
                
        except Exception as e:
            print(f"❌ Password update error: {str(e)}")
            return False
    
    def get_test_marcacao_id(self):
        """Get a marcacao ID for testing status updates"""
        try:
            headers = {"Authorization": f"Bearer {self.admin_token}"}
            response = requests.get(f"{API_BASE}/marcacoes", headers=headers)
            
            if response.status_code == 200:
                data = response.json()
                marcacoes = data.get('marcacoes', [])
                
                if marcacoes:
                    # Find a marcacao that's not already completed
                    for marcacao in marcacoes:
                        if marcacao.get('status') in ['pendente', 'aceita']:
                            return marcacao.get('_id')
                    
                    # If no pending/accepted, use the first one
                    return marcacoes[0].get('_id')
                    
            return None
            
        except Exception as e:
            print(f"❌ Error getting marcacao ID: {str(e)}")
            return None
    
    def test_update_marcacao_status(self):
        """Test PUT /api/marcacoes/{id} - Update booking status"""
        print("\n🧪 Testing PUT /api/marcacoes/{id} (Update booking status)")
        
        # Get a marcacao ID to test with
        marcacao_id = self.get_test_marcacao_id()
        if not marcacao_id:
            print("❌ No marcacao available for testing")
            return False
        
        # Test different status updates
        test_statuses = [
            {"status": "aceita", "token": self.admin_token, "user": "admin"},
            {"status": "concluida", "token": self.barbeiro_token, "user": "barbeiro"},
            {"status": "rejeitada", "token": self.admin_token, "user": "admin"}
        ]
        
        success_count = 0
        
        for test_case in test_statuses:
            status = test_case["status"]
            token = test_case["token"]
            user_type = test_case["user"]
            
            if not token:
                print(f"❌ No {user_type} token available for testing {status}")
                continue
                
            print(f"   Testing status update to '{status}' as {user_type}...")
            
            try:
                headers = {"Authorization": f"Bearer {token}"}
                update_data = {
                    "status": status,
                    "observacoes": f"Status updated to {status} by {user_type} during testing"
                }
                
                response = requests.put(f"{API_BASE}/marcacoes/{marcacao_id}", json=update_data, headers=headers)
                
                if response.status_code == 200:
                    data = response.json()
                    if data.get('success'):
                        print(f"   ✅ Status updated to '{status}' successfully")
                        success_count += 1
                    else:
                        print(f"   ❌ Status update response indicates failure: {data}")
                else:
                    print(f"   ❌ Status update to '{status}' failed: {response.status_code} - {response.text}")
                    
            except Exception as e:
                print(f"   ❌ Status update to '{status}' error: {str(e)}")
        
        if success_count > 0:
            print(f"✅ Marcacao status updates working ({success_count}/{len(test_statuses)} successful)")
            return True
        else:
            print("❌ All marcacao status updates failed")
            return False
    
    def run_all_tests(self):
        """Run all barber management tests"""
        print("🚀 Starting BarbePRO Backend Testing - Barber Management")
        print("=" * 60)
        
        # Login as admin and barbeiro
        self.admin_token = self.login(ADMIN_CREDENTIALS, "admin")
        self.barbeiro_token = self.login(BARBEIRO_CREDENTIALS, "barbeiro")
        
        if not self.admin_token:
            print("❌ Cannot proceed without admin token")
            return False
        
        # Run tests
        test_results = []
        
        # Test 1: Create barbeiro
        test_results.append(("POST /api/barbeiros", self.test_create_barbeiro()))
        
        # Test 2: List barbeiros
        test_results.append(("GET /api/barbeiros", self.test_get_barbeiros()))
        
        # Test 3: Update barbeiro
        test_results.append(("PUT /api/barbeiros/{id}", self.test_update_barbeiro()))
        
        # Test 4: Update barbeiro password
        test_results.append(("PUT /api/barbeiros/{id} (password)", self.test_update_barbeiro_password()))
        
        # Test 5: Update marcacao status
        test_results.append(("PUT /api/marcacoes/{id}", self.test_update_marcacao_status()))
        
        # Summary
        print("\n" + "=" * 60)
        print("📊 TEST SUMMARY")
        print("=" * 60)
        
        passed = 0
        failed = 0
        
        for test_name, result in test_results:
            status = "✅ PASS" if result else "❌ FAIL"
            print(f"{status} {test_name}")
            if result:
                passed += 1
            else:
                failed += 1
        
        print(f"\nTotal: {len(test_results)} tests")
        print(f"Passed: {passed}")
        print(f"Failed: {failed}")
        
        if failed == 0:
            print("\n🎉 All tests passed!")
            return True
        else:
            print(f"\n⚠️  {failed} test(s) failed")
            return False

if __name__ == "__main__":
    tester = BarbePROTester()
    success = tester.run_all_tests()
    sys.exit(0 if success else 1)