#!/usr/bin/env python3
"""
Backend Testing for BarbePRO - New Features Testing
Tests the following new endpoints:
1. GET /api/clientes (CRM - List clients)
2. PUT /api/barbeiro/perfil (Barber updates own profile)
3. POST /api/produtos with image
4. PUT /api/produtos/{id} with image
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
    "email": "joao@premium.pt", 
    "password": "barbeiro123"
}

class BarbePRONewFeaturesTester:
    def __init__(self):
        self.admin_token = None
        self.barbeiro_token = None
        self.created_produto_id = None
        
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
    
    def test_get_clientes_crm(self):
        """Test GET /api/clientes (CRM - List clients with statistics)"""
        print("\n🧪 Testing GET /api/clientes (CRM - List clients)")
        
        if not self.admin_token:
            print("❌ Admin token required for this test")
            return False
            
        try:
            headers = {"Authorization": f"Bearer {self.admin_token}"}
            response = requests.get(f"{API_BASE}/clientes", headers=headers)
            
            if response.status_code == 200:
                data = response.json()
                clientes = data.get('clientes', [])
                
                print(f"✅ CRM endpoint working - Found {len(clientes)} clients")
                
                if clientes:
                    # Verify client statistics fields
                    sample_cliente = clientes[0]
                    required_stats = ['total_marcacoes', 'marcacoes_concluidas', 'total_gasto', 'ultima_visita']
                    
                    for stat in required_stats:
                        if stat not in sample_cliente:
                            print(f"❌ Missing statistic field '{stat}' in client data")
                            return False
                    
                    print("✅ All required client statistics present:")
                    for cliente in clientes:
                        print(f"   - {cliente.get('nome')} ({cliente.get('email')})")
                        print(f"     Total marcações: {cliente.get('total_marcacoes', 0)}")
                        print(f"     Marcações concluídas: {cliente.get('marcacoes_concluidas', 0)}")
                        print(f"     Total gasto: €{cliente.get('total_gasto', 0):.2f}")
                        print(f"     Última visita: {cliente.get('ultima_visita', 'N/A')}")
                else:
                    print("ℹ️  No clients found (this is normal if no bookings exist)")
                
                return True
                
            else:
                print(f"❌ Get clientes failed: {response.status_code} - {response.text}")
                return False
                
        except Exception as e:
            print(f"❌ Get clientes error: {str(e)}")
            return False
    
    def test_barbeiro_update_profile(self):
        """Test PUT /api/barbeiro/perfil (Barber updates own profile)"""
        print("\n🧪 Testing PUT /api/barbeiro/perfil (Barber updates own profile)")
        
        if not self.barbeiro_token:
            print("❌ Barbeiro token required for this test")
            return False
            
        # Test data for profile update
        profile_data = {
            "nome": "João Silva Santos",
            "telemovel": "+351 914 567 890",
            "biografia": "Barbeiro profissional com 15 anos de experiência em cortes clássicos e modernos. Especialista em barbear tradicional.",
            "especialidades": ["Corte Clássico", "Barbear Tradicional", "Styling Moderno", "Tratamentos"],
            "foto": "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400"
        }
        
        try:
            headers = {"Authorization": f"Bearer {self.barbeiro_token}"}
            response = requests.put(f"{API_BASE}/barbeiro/perfil", json=profile_data, headers=headers)
            
            if response.status_code == 200:
                data = response.json()
                user = data.get('user', {})
                
                # Verify all fields were updated
                if user.get('nome') != profile_data['nome']:
                    print(f"❌ Nome not updated: expected {profile_data['nome']}, got {user.get('nome')}")
                    return False
                    
                if user.get('telemovel') != profile_data['telemovel']:
                    print(f"❌ Telemovel not updated")
                    return False
                    
                if user.get('biografia') != profile_data['biografia']:
                    print(f"❌ Biografia not updated")
                    return False
                    
                if user.get('especialidades') != profile_data['especialidades']:
                    print(f"❌ Especialidades not updated")
                    return False
                    
                if user.get('foto') != profile_data['foto']:
                    print(f"❌ Foto not updated")
                    return False
                
                print("✅ Barbeiro profile updated successfully:")
                print(f"   - Nome: {user.get('nome')}")
                print(f"   - Telemovel: {user.get('telemovel')}")
                print(f"   - Biografia: {user.get('biografia')[:50]}...")
                print(f"   - Especialidades: {user.get('especialidades')}")
                print(f"   - Foto: {user.get('foto')}")
                return True
                
            else:
                print(f"❌ Barbeiro profile update failed: {response.status_code} - {response.text}")
                return False
                
        except Exception as e:
            print(f"❌ Barbeiro profile update error: {str(e)}")
            return False
    
    def test_barbeiro_update_profile_with_password(self):
        """Test PUT /api/barbeiro/perfil with password update"""
        print("\n🧪 Testing PUT /api/barbeiro/perfil (with password update)")
        
        if not self.barbeiro_token:
            print("❌ Barbeiro token required for this test")
            return False
            
        # Test data with password
        profile_data = {
            "nome": "João Silva Santos",
            "telemovel": "+351 914 567 890",
            "biografia": "Barbeiro profissional com 15 anos de experiência em cortes clássicos e modernos. Especialista em barbear tradicional.",
            "especialidades": ["Corte Clássico", "Barbear Tradicional", "Styling Moderno", "Tratamentos"],
            "foto": "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400",
            "password": "newbarbeiropass123"
        }
        
        try:
            headers = {"Authorization": f"Bearer {self.barbeiro_token}"}
            response = requests.put(f"{API_BASE}/barbeiro/perfil", json=profile_data, headers=headers)
            
            if response.status_code == 200:
                data = response.json()
                user = data.get('user', {})
                
                # Verify password is not in response
                if 'password' in user:
                    print("❌ Password field should not be returned in response")
                    return False
                    
                print("✅ Password update successful (password field correctly excluded from response)")
                return True
                
            else:
                print(f"❌ Barbeiro profile update with password failed: {response.status_code} - {response.text}")
                return False
                
        except Exception as e:
            print(f"❌ Barbeiro profile update with password error: {str(e)}")
            return False
    
    def test_create_produto_with_image(self):
        """Test POST /api/produtos with image"""
        print("\n🧪 Testing POST /api/produtos (Create product with image)")
        
        if not self.admin_token:
            print("❌ Admin token required for this test")
            return False
            
        # Test data with image
        produto_data = {
            "nome": "Pomada Modeladora Premium",
            "preco": 25.99,
            "descricao": "Pomada de alta qualidade para modelar e fixar o cabelo com acabamento natural",
            "imagem": "https://images.unsplash.com/photo-1585747860715-2ba37e788b70?w=400"
        }
        
        try:
            headers = {"Authorization": f"Bearer {self.admin_token}"}
            response = requests.post(f"{API_BASE}/produtos", json=produto_data, headers=headers)
            
            if response.status_code == 200:
                data = response.json()
                produto = data.get('produto', {})
                self.created_produto_id = produto.get('_id')
                
                # Verify all fields including image
                if produto.get('nome') != produto_data['nome']:
                    print(f"❌ Nome mismatch: expected {produto_data['nome']}, got {produto.get('nome')}")
                    return False
                    
                if produto.get('preco') != produto_data['preco']:
                    print(f"❌ Preco mismatch: expected {produto_data['preco']}, got {produto.get('preco')}")
                    return False
                    
                if produto.get('descricao') != produto_data['descricao']:
                    print(f"❌ Descricao mismatch")
                    return False
                    
                if produto.get('imagem') != produto_data['imagem']:
                    print(f"❌ Imagem mismatch: expected {produto_data['imagem']}, got {produto.get('imagem')}")
                    return False
                
                print(f"✅ Product created successfully with image - ID: {self.created_produto_id}")
                print(f"   - Nome: {produto.get('nome')}")
                print(f"   - Preço: €{produto.get('preco')}")
                print(f"   - Descrição: {produto.get('descricao')[:50]}...")
                print(f"   - Imagem: {produto.get('imagem')}")
                return True
                
            else:
                print(f"❌ Create produto with image failed: {response.status_code} - {response.text}")
                return False
                
        except Exception as e:
            print(f"❌ Create produto with image error: {str(e)}")
            return False
    
    def test_update_produto_with_image(self):
        """Test PUT /api/produtos/{id} with image"""
        print("\n🧪 Testing PUT /api/produtos/{id} (Update product with image)")
        
        if not self.admin_token:
            print("❌ Admin token required for this test")
            return False
            
        if not self.created_produto_id:
            print("❌ No produto ID available for update test")
            return False
            
        # Updated data with new image
        update_data = {
            "nome": "Pomada Modeladora Premium Deluxe",
            "preco": 29.99,
            "descricao": "Pomada de alta qualidade premium para modelar e fixar o cabelo com acabamento natural e longa duração",
            "imagem": "https://images.unsplash.com/photo-1556228578-8c89e6adf883?w=400"
        }
        
        try:
            headers = {"Authorization": f"Bearer {self.admin_token}"}
            response = requests.put(f"{API_BASE}/produtos/{self.created_produto_id}", json=update_data, headers=headers)
            
            if response.status_code == 200:
                print("✅ Product updated successfully with new image")
                
                # Verify the update by getting the product
                get_response = requests.get(f"{API_BASE}/produtos", headers=headers)
                if get_response.status_code == 200:
                    produtos = get_response.json().get('produtos', [])
                    updated_produto = next((p for p in produtos if p.get('_id') == self.created_produto_id), None)
                    
                    if updated_produto:
                        if updated_produto.get('nome') != update_data['nome']:
                            print(f"❌ Nome not updated: expected {update_data['nome']}, got {updated_produto.get('nome')}")
                            return False
                            
                        if updated_produto.get('preco') != update_data['preco']:
                            print(f"❌ Preco not updated: expected {update_data['preco']}, got {updated_produto.get('preco')}")
                            return False
                            
                        if updated_produto.get('imagem') != update_data['imagem']:
                            print(f"❌ Imagem not updated: expected {update_data['imagem']}, got {updated_produto.get('imagem')}")
                            return False
                        
                        print(f"✅ Product update verified:")
                        print(f"   - Nome: {updated_produto.get('nome')}")
                        print(f"   - Preço: €{updated_produto.get('preco')}")
                        print(f"   - Descrição: {updated_produto.get('descricao')[:50]}...")
                        print(f"   - Imagem: {updated_produto.get('imagem')}")
                        return True
                    else:
                        print("❌ Updated product not found in list")
                        return False
                else:
                    print("❌ Could not verify product update")
                    return False
                
            else:
                print(f"❌ Update produto with image failed: {response.status_code} - {response.text}")
                return False
                
        except Exception as e:
            print(f"❌ Update produto with image error: {str(e)}")
            return False
    
    def run_all_tests(self):
        """Run all new features tests"""
        print("🚀 Starting BarbePRO Backend Testing - New Features")
        print("=" * 60)
        
        # Login as admin and barbeiro
        self.admin_token = self.login(ADMIN_CREDENTIALS, "admin")
        self.barbeiro_token = self.login(BARBEIRO_CREDENTIALS, "barbeiro")
        
        if not self.admin_token:
            print("❌ Cannot proceed without admin token")
            return False
        
        if not self.barbeiro_token:
            print("⚠️  Some tests will be skipped without barbeiro token")
        
        # Run tests
        test_results = []
        
        # Test 1: CRM - List clients
        test_results.append(("GET /api/clientes (CRM)", self.test_get_clientes_crm()))
        
        # Test 2: Barbeiro profile update
        if self.barbeiro_token:
            test_results.append(("PUT /api/barbeiro/perfil", self.test_barbeiro_update_profile()))
            test_results.append(("PUT /api/barbeiro/perfil (password)", self.test_barbeiro_update_profile_with_password()))
        
        # Test 3: Create product with image
        test_results.append(("POST /api/produtos (with image)", self.test_create_produto_with_image()))
        
        # Test 4: Update product with image
        test_results.append(("PUT /api/produtos/{id} (with image)", self.test_update_produto_with_image()))
        
        # Summary
        print("\n" + "=" * 60)
        print("📊 NEW FEATURES TEST SUMMARY")
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
            print("\n🎉 All new features tests passed!")
            return True
        else:
            print(f"\n⚠️  {failed} test(s) failed")
            return False

if __name__ == "__main__":
    tester = BarbePRONewFeaturesTester()
    success = tester.run_all_tests()
    sys.exit(0 if success else 1)