#!/usr/bin/env python3
"""
Backend Testing for Manual Booking APIs - Barbershop SaaS
Tests the following new endpoints:
1. POST /api/clientes/manual (Create manual client - Admin/Barbeiro access)
2. POST /api/marcacoes/manual (Create manual booking - Admin/Barbeiro access)

Test scenarios:
- Admin creates manual client and booking
- Barbeiro creates manual client and booking for themselves
- Barbeiro tries to create booking for another barbeiro (should fail)
- Validation tests (required fields, conflicts, etc.)
"""

import requests
import json
import sys
from datetime import datetime, timedelta

# Base URL from environment
BASE_URL = "https://ticketsupport-2.preview.emergentagent.com"
API_BASE = f"{BASE_URL}/api"

# Test credentials
ADMIN_CREDENTIALS = {
    "email": "admin@premium.pt",
    "password": "admin123"
}

BARBEIRO_CREDENTIALS = {
    "email": "test.barbeiro@premium.pt", 
    "password": "barbeiro123"
}

class ManualBookingTester:
    def __init__(self):
        self.admin_token = None
        self.barbeiro_token = None
        self.barbeiro_id = None
        self.servico_id = None
        self.created_cliente_id = None
        self.created_marcacao_id = None
        
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
                
                # Store barbeiro ID for later use
                if user_type == "barbeiro":
                    self.barbeiro_id = user.get('_id')
                    
                return token
            else:
                print(f"❌ Login failed: {response.status_code} - {response.text}")
                return None
                
        except Exception as e:
            print(f"❌ Login error: {str(e)}")
            return None
    
    def get_servico_id(self):
        """Get a service ID for testing"""
        try:
            headers = {"Authorization": f"Bearer {self.admin_token}"}
            response = requests.get(f"{API_BASE}/servicos", headers=headers)
            
            if response.status_code == 200:
                data = response.json()
                servicos = data.get('servicos', [])
                
                if servicos:
                    self.servico_id = servicos[0].get('_id')
                    print(f"📋 Using service: {servicos[0].get('nome')} (ID: {self.servico_id})")
                    return True
                    
            print("❌ No services found")
            return False
            
        except Exception as e:
            print(f"❌ Error getting service ID: {str(e)}")
            return False
    
    def test_admin_create_manual_client(self):
        """Test POST /api/clientes/manual - Admin creates manual client"""
        print("\n🧪 Testing POST /api/clientes/manual (Admin creates manual client)")
        
        if not self.admin_token:
            print("❌ Admin token required for this test")
            return False
            
        # Test data for manual client
        client_data = {
            "nome": "Maria Silva Santos",
            "email": "maria.santos@cliente.pt",
            "telemovel": "+351 912 345 678"
        }
        
        try:
            headers = {"Authorization": f"Bearer {self.admin_token}"}
            response = requests.post(f"{API_BASE}/clientes/manual", json=client_data, headers=headers)
            
            if response.status_code == 200:
                data = response.json()
                cliente = data.get('cliente', {})
                self.created_cliente_id = cliente.get('_id')
                
                # Verify required fields
                required_fields = ['nome', 'email', 'telemovel', 'tipo', 'criado_manualmente', 'criado_por']
                missing_fields = [field for field in required_fields if field not in cliente]
                
                if missing_fields:
                    print(f"❌ Missing fields in response: {missing_fields}")
                    return False
                
                # Verify field values
                if cliente.get('nome') != client_data['nome']:
                    print(f"❌ Nome mismatch: expected {client_data['nome']}, got {cliente.get('nome')}")
                    return False
                    
                if cliente.get('email') != client_data['email']:
                    print(f"❌ Email mismatch: expected {client_data['email']}, got {cliente.get('email')}")
                    return False
                    
                if cliente.get('telemovel') != client_data['telemovel']:
                    print(f"❌ Telemovel mismatch: expected {client_data['telemovel']}, got {cliente.get('telemovel')}")
                    return False
                
                if cliente.get('tipo') != 'cliente':
                    print(f"❌ Tipo should be 'cliente', got {cliente.get('tipo')}")
                    return False
                    
                if not cliente.get('criado_manualmente'):
                    print("❌ criado_manualmente should be true")
                    return False
                
                print(f"✅ Manual client created successfully by admin:")
                print(f"   - ID: {self.created_cliente_id}")
                print(f"   - Nome: {cliente.get('nome')}")
                print(f"   - Email: {cliente.get('email')}")
                print(f"   - Telemovel: {cliente.get('telemovel')}")
                print(f"   - Criado manualmente: {cliente.get('criado_manualmente')}")
                return True
                
            else:
                print(f"❌ Create manual client failed: {response.status_code} - {response.text}")
                return False
                
        except Exception as e:
            print(f"❌ Create manual client error: {str(e)}")
            return False
    
    def test_admin_create_manual_client_without_email(self):
        """Test POST /api/clientes/manual - Admin creates client without email (should generate fake email)"""
        print("\n🧪 Testing POST /api/clientes/manual (Admin creates client without email)")
        
        if not self.admin_token:
            print("❌ Admin token required for this test")
            return False
            
        # Test data without email
        client_data = {
            "nome": "João Telefone Apenas",
            "telemovel": "+351 913 456 789"
        }
        
        try:
            headers = {"Authorization": f"Bearer {self.admin_token}"}
            response = requests.post(f"{API_BASE}/clientes/manual", json=client_data, headers=headers)
            
            if response.status_code == 200:
                data = response.json()
                cliente = data.get('cliente', {})
                
                # Verify fake email was generated
                email = cliente.get('email', '')
                if not email.endswith('@manual.local'):
                    print(f"❌ Expected fake email ending with @manual.local, got {email}")
                    return False
                
                print(f"✅ Manual client without email created successfully:")
                print(f"   - Nome: {cliente.get('nome')}")
                print(f"   - Generated Email: {email}")
                print(f"   - Telemovel: {cliente.get('telemovel')}")
                return True
                
            else:
                print(f"❌ Create manual client without email failed: {response.status_code} - {response.text}")
                return False
                
        except Exception as e:
            print(f"❌ Create manual client without email error: {str(e)}")
            return False
    
    def test_barbeiro_create_manual_client(self):
        """Test POST /api/clientes/manual - Barbeiro creates manual client"""
        print("\n🧪 Testing POST /api/clientes/manual (Barbeiro creates manual client)")
        
        if not self.barbeiro_token:
            print("❌ Barbeiro token required for this test")
            return False
            
        # Test data for manual client
        client_data = {
            "nome": "Carlos Barbeiro Cliente",
            "email": "carlos.barbeiro@cliente.pt",
            "telemovel": "+351 914 567 890"
        }
        
        try:
            headers = {"Authorization": f"Bearer {self.barbeiro_token}"}
            response = requests.post(f"{API_BASE}/clientes/manual", json=client_data, headers=headers)
            
            if response.status_code == 200:
                data = response.json()
                cliente = data.get('cliente', {})
                
                print(f"✅ Manual client created successfully by barbeiro:")
                print(f"   - Nome: {cliente.get('nome')}")
                print(f"   - Email: {cliente.get('email')}")
                print(f"   - Criado manualmente: {cliente.get('criado_manualmente')}")
                return True
                
            else:
                print(f"❌ Barbeiro create manual client failed: {response.status_code} - {response.text}")
                return False
                
        except Exception as e:
            print(f"❌ Barbeiro create manual client error: {str(e)}")
            return False
    
    def test_admin_create_manual_booking(self):
        """Test POST /api/marcacoes/manual - Admin creates manual booking"""
        print("\n🧪 Testing POST /api/marcacoes/manual (Admin creates manual booking)")
        
        if not self.admin_token or not self.created_cliente_id or not self.barbeiro_id or not self.servico_id:
            print("❌ Admin token, client ID, barbeiro ID and service ID required for this test")
            return False
            
        # Calculate a future date for booking
        future_date = datetime.now() + timedelta(days=7)
        booking_date = future_date.strftime('%Y-%m-%d')
        booking_time = "14:00"
        
        booking_data = {
            "cliente_id": self.created_cliente_id,
            "barbeiro_id": self.barbeiro_id,
            "servico_id": self.servico_id,
            "data": booking_date,
            "hora": booking_time
        }
        
        try:
            headers = {"Authorization": f"Bearer {self.admin_token}"}
            response = requests.post(f"{API_BASE}/marcacoes/manual", json=booking_data, headers=headers)
            
            if response.status_code == 200:
                data = response.json()
                marcacao = data.get('marcacao', {})
                self.created_marcacao_id = marcacao.get('_id')
                
                # Verify required fields
                required_fields = ['cliente_id', 'barbeiro_id', 'servico_id', 'data', 'hora', 'status', 'criado_manualmente', 'criado_por']
                missing_fields = [field for field in required_fields if field not in marcacao]
                
                if missing_fields:
                    print(f"❌ Missing fields in response: {missing_fields}")
                    return False
                
                # Verify field values
                if marcacao.get('cliente_id') != booking_data['cliente_id']:
                    print(f"❌ Cliente ID mismatch")
                    return False
                    
                if marcacao.get('barbeiro_id') != booking_data['barbeiro_id']:
                    print(f"❌ Barbeiro ID mismatch")
                    return False
                    
                if marcacao.get('servico_id') != booking_data['servico_id']:
                    print(f"❌ Servico ID mismatch")
                    return False
                    
                if marcacao.get('data') != booking_data['data']:
                    print(f"❌ Data mismatch")
                    return False
                    
                if marcacao.get('hora') != booking_data['hora']:
                    print(f"❌ Hora mismatch")
                    return False
                
                if marcacao.get('status') != 'aceita':
                    print(f"❌ Status should be 'aceita' for manual bookings, got {marcacao.get('status')}")
                    return False
                    
                if not marcacao.get('criado_manualmente'):
                    print("❌ criado_manualmente should be true")
                    return False
                
                print(f"✅ Manual booking created successfully by admin:")
                print(f"   - ID: {self.created_marcacao_id}")
                print(f"   - Data: {marcacao.get('data')}")
                print(f"   - Hora: {marcacao.get('hora')}")
                print(f"   - Status: {marcacao.get('status')}")
                print(f"   - Criado manualmente: {marcacao.get('criado_manualmente')}")
                return True
                
            else:
                print(f"❌ Create manual booking failed: {response.status_code} - {response.text}")
                return False
                
        except Exception as e:
            print(f"❌ Create manual booking error: {str(e)}")
            return False
    
    def test_barbeiro_create_manual_booking_for_self(self):
        """Test POST /api/marcacoes/manual - Barbeiro creates booking for themselves"""
        print("\n🧪 Testing POST /api/marcacoes/manual (Barbeiro creates booking for self)")
        
        if not self.barbeiro_token or not self.created_cliente_id or not self.barbeiro_id or not self.servico_id:
            print("❌ Barbeiro token, client ID, barbeiro ID and service ID required for this test")
            return False
            
        # Calculate a different future date for booking
        future_date = datetime.now() + timedelta(days=8)
        booking_date = future_date.strftime('%Y-%m-%d')
        booking_time = "15:00"
        
        booking_data = {
            "cliente_id": self.created_cliente_id,
            "barbeiro_id": self.barbeiro_id,  # Same as logged in barbeiro
            "servico_id": self.servico_id,
            "data": booking_date,
            "hora": booking_time
        }
        
        try:
            headers = {"Authorization": f"Bearer {self.barbeiro_token}"}
            response = requests.post(f"{API_BASE}/marcacoes/manual", json=booking_data, headers=headers)
            
            if response.status_code == 200:
                data = response.json()
                marcacao = data.get('marcacao', {})
                
                print(f"✅ Manual booking created successfully by barbeiro for self:")
                print(f"   - Data: {marcacao.get('data')}")
                print(f"   - Hora: {marcacao.get('hora')}")
                print(f"   - Status: {marcacao.get('status')}")
                return True
                
            else:
                print(f"❌ Barbeiro create manual booking for self failed: {response.status_code} - {response.text}")
                return False
                
        except Exception as e:
            print(f"❌ Barbeiro create manual booking for self error: {str(e)}")
            return False
    
    def test_barbeiro_create_booking_for_other_barbeiro(self):
        """Test POST /api/marcacoes/manual - Barbeiro tries to create booking for another barbeiro (should fail)"""
        print("\n🧪 Testing POST /api/marcacoes/manual (Barbeiro tries to create booking for another barbeiro - should fail)")
        
        if not self.barbeiro_token or not self.created_cliente_id or not self.servico_id:
            print("❌ Barbeiro token, client ID and service ID required for this test")
            return False
        
        # Use a fake barbeiro ID (different from logged in barbeiro)
        fake_barbeiro_id = "507f1f77bcf86cd799439011"  # Valid ObjectId format but different
        
        # Calculate a future date for booking
        future_date = datetime.now() + timedelta(days=9)
        booking_date = future_date.strftime('%Y-%m-%d')
        booking_time = "16:00"
        
        booking_data = {
            "cliente_id": self.created_cliente_id,
            "barbeiro_id": fake_barbeiro_id,  # Different barbeiro
            "servico_id": self.servico_id,
            "data": booking_date,
            "hora": booking_time
        }
        
        try:
            headers = {"Authorization": f"Bearer {self.barbeiro_token}"}
            response = requests.post(f"{API_BASE}/marcacoes/manual", json=booking_data, headers=headers)
            
            if response.status_code == 403:
                print("✅ Correctly blocked barbeiro from creating booking for another barbeiro (403 Forbidden)")
                return True
            elif response.status_code == 404:
                print("✅ Correctly returned 404 for non-existent barbeiro")
                return True
            else:
                print(f"❌ Expected 403 or 404, but got {response.status_code} - {response.text}")
                return False
                
        except Exception as e:
            print(f"❌ Test barbeiro create booking for other error: {str(e)}")
            return False
    
    def test_validation_missing_fields(self):
        """Test validation - missing required fields"""
        print("\n🧪 Testing validation - missing required fields")
        
        if not self.admin_token:
            print("❌ Admin token required for this test")
            return False
        
        # Test missing nome for client creation
        print("   Testing missing 'nome' for client creation...")
        try:
            headers = {"Authorization": f"Bearer {self.admin_token}"}
            response = requests.post(f"{API_BASE}/clientes/manual", json={"email": "test@test.pt"}, headers=headers)
            
            if response.status_code == 400:
                print("   ✅ Correctly rejected client creation without nome (400)")
            else:
                print(f"   ❌ Expected 400 for missing nome, got {response.status_code}")
                return False
        except Exception as e:
            print(f"   ❌ Error testing missing nome: {str(e)}")
            return False
        
        # Test missing fields for booking creation
        print("   Testing missing fields for booking creation...")
        try:
            headers = {"Authorization": f"Bearer {self.admin_token}"}
            incomplete_booking = {"cliente_id": "test", "barbeiro_id": "test"}  # Missing servico_id, data, hora
            response = requests.post(f"{API_BASE}/marcacoes/manual", json=incomplete_booking, headers=headers)
            
            if response.status_code == 400:
                print("   ✅ Correctly rejected booking creation with missing fields (400)")
            else:
                print(f"   ❌ Expected 400 for missing fields, got {response.status_code}")
                return False
        except Exception as e:
            print(f"   ❌ Error testing missing booking fields: {str(e)}")
            return False
        
        print("✅ All validation tests passed")
        return True
    
    def test_duplicate_email_client(self):
        """Test creating client with duplicate email"""
        print("\n🧪 Testing duplicate email validation")
        
        if not self.admin_token:
            print("❌ Admin token required for this test")
            return False
        
        # Try to create client with same email as admin
        duplicate_client_data = {
            "nome": "Duplicate Email Test",
            "email": "admin@premium.pt"  # Same as admin
        }
        
        try:
            headers = {"Authorization": f"Bearer {self.admin_token}"}
            response = requests.post(f"{API_BASE}/clientes/manual", json=duplicate_client_data, headers=headers)
            
            if response.status_code == 400:
                print("✅ Correctly rejected duplicate email (400)")
                return True
            else:
                print(f"❌ Expected 400 for duplicate email, got {response.status_code} - {response.text}")
                return False
                
        except Exception as e:
            print(f"❌ Test duplicate email error: {str(e)}")
            return False
    
    def test_time_conflict_booking(self):
        """Test creating booking with time conflict"""
        print("\n🧪 Testing time conflict validation")
        
        if not self.admin_token or not self.created_cliente_id or not self.barbeiro_id or not self.servico_id:
            print("❌ Required data not available for conflict test")
            return False
        
        # Try to create booking at same time as existing booking
        future_date = datetime.now() + timedelta(days=7)
        booking_date = future_date.strftime('%Y-%m-%d')
        booking_time = "14:00"  # Same as first booking
        
        conflict_booking_data = {
            "cliente_id": self.created_cliente_id,
            "barbeiro_id": self.barbeiro_id,
            "servico_id": self.servico_id,
            "data": booking_date,
            "hora": booking_time
        }
        
        try:
            headers = {"Authorization": f"Bearer {self.admin_token}"}
            response = requests.post(f"{API_BASE}/marcacoes/manual", json=conflict_booking_data, headers=headers)
            
            if response.status_code == 400:
                print("✅ Correctly rejected time conflict (400)")
                return True
            else:
                print(f"❌ Expected 400 for time conflict, got {response.status_code} - {response.text}")
                return False
                
        except Exception as e:
            print(f"❌ Test time conflict error: {str(e)}")
            return False
    
    def test_unauthorized_access(self):
        """Test unauthorized access to manual booking endpoints"""
        print("\n🧪 Testing unauthorized access")
        
        # Test without token
        try:
            response = requests.post(f"{API_BASE}/clientes/manual", json={"nome": "Test"})
            
            if response.status_code == 401:
                print("✅ Correctly rejected request without token (401)")
            else:
                print(f"❌ Expected 401 for no token, got {response.status_code}")
                return False
        except Exception as e:
            print(f"❌ Test unauthorized access error: {str(e)}")
            return False
        
        # Test with invalid token
        try:
            headers = {"Authorization": "Bearer invalid_token"}
            response = requests.post(f"{API_BASE}/clientes/manual", json={"nome": "Test"}, headers=headers)
            
            if response.status_code == 401:
                print("✅ Correctly rejected request with invalid token (401)")
                return True
            else:
                print(f"❌ Expected 401 for invalid token, got {response.status_code}")
                return False
        except Exception as e:
            print(f"❌ Test invalid token error: {str(e)}")
            return False
    
    def run_all_tests(self):
        """Run all manual booking tests"""
        print("🚀 Starting Manual Booking APIs Testing")
        print("=" * 60)
        
        # Login as admin and barbeiro
        self.admin_token = self.login(ADMIN_CREDENTIALS, "admin")
        self.barbeiro_token = self.login(BARBEIRO_CREDENTIALS, "barbeiro")
        
        if not self.admin_token:
            print("❌ Cannot proceed without admin token")
            return False
        
        if not self.barbeiro_token:
            print("❌ Cannot proceed without barbeiro token")
            return False
        
        # Get service ID for testing
        if not self.get_servico_id():
            print("❌ Cannot proceed without service ID")
            return False
        
        # Run tests
        test_results = []
        
        # Test 1: Admin creates manual client
        test_results.append(("Admin creates manual client", self.test_admin_create_manual_client()))
        
        # Test 2: Admin creates manual client without email
        test_results.append(("Admin creates client without email", self.test_admin_create_manual_client_without_email()))
        
        # Test 3: Barbeiro creates manual client
        test_results.append(("Barbeiro creates manual client", self.test_barbeiro_create_manual_client()))
        
        # Test 4: Admin creates manual booking
        test_results.append(("Admin creates manual booking", self.test_admin_create_manual_booking()))
        
        # Test 5: Barbeiro creates booking for self
        test_results.append(("Barbeiro creates booking for self", self.test_barbeiro_create_manual_booking_for_self()))
        
        # Test 6: Barbeiro tries to create booking for other barbeiro (should fail)
        test_results.append(("Barbeiro blocked from other barbeiro booking", self.test_barbeiro_create_booking_for_other_barbeiro()))
        
        # Test 7: Validation tests
        test_results.append(("Validation - missing fields", self.test_validation_missing_fields()))
        
        # Test 8: Duplicate email test
        test_results.append(("Duplicate email validation", self.test_duplicate_email_client()))
        
        # Test 9: Time conflict test
        test_results.append(("Time conflict validation", self.test_time_conflict_booking()))
        
        # Test 10: Unauthorized access
        test_results.append(("Unauthorized access protection", self.test_unauthorized_access()))
        
        # Summary
        print("\n" + "=" * 60)
        print("📊 MANUAL BOOKING APIS TEST SUMMARY")
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
            print("\n🎉 All manual booking API tests passed!")
            return True
        else:
            print(f"\n⚠️  {failed} test(s) failed")
            return False

if __name__ == "__main__":
    tester = ManualBookingTester()
    success = tester.run_all_tests()
    sys.exit(0 if success else 1)