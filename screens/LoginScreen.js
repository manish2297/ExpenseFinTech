import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { AuthStore } from '../store';

export default function LoginScreen({ onLogin }) {
  const [pin, setPin] = useState('');
  const [savedPin, setSavedPin] = useState(null);
  const [isSetupMode, setIsSetupMode] = useState(true);

  useEffect(() => {
    async function checkExistingPin() {
      const existingPin = await AuthStore.getPin();
      if (existingPin) {
        setSavedPin(existingPin);
        setIsSetupMode(false);
      }
    }
    checkExistingPin();
  }, []);

  const handlePress = async () => {
    if (pin.length < 4) {
      return Alert.alert("Invalid PIN", "Please enter a 4-digit PIN.");
    }

    if (isSetupMode) {
      await AuthStore.savePin(pin);
      Alert.alert("Success", "PIN created successfully!");
      onLogin(); 
    } else {
      if (pin === savedPin) {
        onLogin(); 
      } else {
        Alert.alert("Error", "Incorrect PIN. Please try again.");
        setPin(''); 
      }
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.content}>
        
        <View style={styles.iconContainer}>
          <Ionicons name="lock-closed" size={50} color="#05A46D" />
        </View>

        <Text style={styles.title}>
          {isSetupMode ? "Create a PIN" : "Welcome Back"}
        </Text>
        <Text style={styles.subtitle}>
          {isSetupMode ? "Set a 4-digit security PIN to protect your wallet." : "Enter your 4-digit PIN to access your wallet."}
        </Text>

        <TextInput
          style={styles.pinInput}
          value={pin}
          onChangeText={setPin}
          keyboardType="numeric"
          maxLength={4}
          secureTextEntry={true} 
          autoFocus={true}
          placeholder="••••"
          placeholderTextColor="#CCC"
        />

        <TouchableOpacity style={styles.button} onPress={handlePress}>
          <Text style={styles.buttonText}>
            {isSetupMode ? "Secure Wallet" : "Unlock Wallet"}
          </Text>
        </TouchableOpacity>

      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  content: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 30 },
  iconContainer: { width: 100, height: 100, backgroundColor: '#E8F5E9', borderRadius: 50, justifyContent: 'center', alignItems: 'center', marginBottom: 30 },
  title: { fontSize: 28, fontWeight: '700', color: '#1C1C1E', marginBottom: 10 },
  subtitle: { fontSize: 15, color: '#666', textAlign: 'center', marginBottom: 40, lineHeight: 22 },
  pinInput: { fontSize: 32, letterSpacing: 20, textAlign: 'center', borderBottomWidth: 2, borderBottomColor: '#05A46D', width: '60%', paddingBottom: 10, marginBottom: 40, color: '#1C1C1E' },
  button: { backgroundColor: '#05A46D', paddingVertical: 18, borderRadius: 16, width: '100%', alignItems: 'center', elevation: 2 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '700' }
});