import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

export default function HomeScreen() {
  const [screen, setScreen] = useState<'login' | 'dashboard'>('login');
  const [email, setEmail] = useState('');
  const [user, setUser] = useState(null);

  const handleLogin = async () => {
    console.log('🔄 Calling BACKEND API:', email); // DEBUG
    
    try {
      const response = await fetch('http://localhost:5000/api/login', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json' 
        },
        body: JSON.stringify({ email })
      });
      
      console.log('📡 Backend status:', response.status); // DEBUG
      const data = await response.json();
      console.log('📄 Backend data:', data); // DEBUG
      
      if (data.success) {
        console.log('✅ LOGIN SUCCESS - Real data from MongoDB!');
        setUser(data.patient);
        setScreen('dashboard');
      } else {
        console.log('❌ Login failed:', data.error);
        alert('Login failed: ' + data.error);
      }
    } catch (error) {
      console.error('❌ Network error:', error);
      alert('Backend error: ' + error.message + '\nMake sure backend is running on port 5000');
    }
  };

  const handleLogout = () => {
    setUser(null);
    setEmail('');
    setScreen('login');
    console.log('🔄 Logged out');
  };

  if (screen === 'login') {
    return (
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>Patient Portal</Text>
        <TextInput
          style={styles.input}
          placeholder="Email (test@example.com)"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
        />
        <TouchableOpacity style={styles.button} onPress={handleLogin}>
          <Text style={styles.buttonText}>Log In (Real Backend)</Text>
        </TouchableOpacity>
      </ScrollView>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.greeting}>Welcome, {user?.name}!</Text>
      
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Account Info</Text>
        <Text style={styles.cardText}>📧 {user?.email}</Text>
        <Text style={styles.cardText}>👤 Role: {user?.role}</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>📅 Appointments</Text>
        <Text style={styles.cardText}>No upcoming appointments</Text>
      </View>

      <TouchableOpacity 
        style={[styles.button, styles.logoutButton]} 
        onPress={handleLogout}
      >
        <Text style={styles.buttonText}>Log Out</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

// ... keep your existing styles unchanged ...
const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 24,
    backgroundColor: '#f8fafc',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 32,
    textAlign: 'center',
  },
  greeting: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 24,
    textAlign: 'center',
  },
  input: {
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    backgroundColor: 'white',
    marginBottom: 24,
  },
  button: {
    backgroundColor: '#3b82f6',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
  },
  logoutButton: {
    backgroundColor: '#ef4444',
    marginTop: 24,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  card: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 12,
  },
  cardText: {
    fontSize: 16,
    color: '#64748b',
    lineHeight: 24,
  },
});
