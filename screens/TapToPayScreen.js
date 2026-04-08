import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, Easing } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { TransactionStore, WalletStore } from '../store';

export default function TapToPayScreen({ navigation }) {
  const [status, setStatus] = useState('ready'); // 'ready', 'processing', 'success'
  const pulseAnim = new Animated.Value(1);

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.2, duration: 800, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 800, easing: Easing.inOut(Easing.ease), useNativeDriver: true })
      ])
    ).start();
  }, []);

  const processNFCPayment = async () => {
    setStatus('processing');

    setTimeout(async () => {
      const newTx = {
        id: Date.now().toString(),
        title: 'Coffee Shop', 
        subtitle: 'Tap to Pay via NFC',
        amount: '-₹ 350',
        date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        icon: 'cafe-outline',
        color: '#FF9500',
        isExpense: true
      };

      await TransactionStore.add(newTx);
      
      // Assumes your primary wallet ID is '1'
      await WalletStore.updateBalance('1', '350', true);

      setStatus('success');
      setTimeout(() => {
        navigation.navigate('Home');
      }, 1500);

    }, 1500); 
  };

  return (
    <SafeAreaView style={styles.container}>
      <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
        <Ionicons name="close" size={28} color="#333" />
      </TouchableOpacity>

      <View style={styles.content}>
        <Text style={styles.title}>Tap to Pay</Text>
        <Text style={styles.subtitle}>Hold your phone near the reader</Text>

        <TouchableOpacity 
          activeOpacity={0.8} 
          onPress={processNFCPayment}
          disabled={status !== 'ready'}
        >
          <Animated.View style={[styles.pulseCircle, { transform: [{ scale: pulseAnim }] }]}>
            <View style={styles.innerCircle}>
              {status === 'ready' && <Ionicons name="wifi" size={60} color="#fff" style={{ transform: [{ rotate: '90deg' }] }} />}
              {status === 'processing' && <Ionicons name="sync" size={50} color="#fff" />}
              {status === 'success' && <Ionicons name="checkmark-circle" size={60} color="#fff" />}
            </View>
          </Animated.View>
        </TouchableOpacity>

        <Text style={styles.statusText}>
          {status === 'ready' && "(Tap the icon to simulate payment)"}
          {status === 'processing' && "Processing Payment..."}
          {status === 'success' && "Payment Successful!"}
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  backBtn: { position: 'absolute', top: 50, right: 20, zIndex: 10 },
  content: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 28, fontWeight: 'bold', color: '#1C1C1E', marginBottom: 8 },
  subtitle: { fontSize: 16, color: '#8E8E93', marginBottom: 60 },
  pulseCircle: {
    width: 200, height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(5, 164, 109, 0.2)',
    justifyContent: 'center', alignItems: 'center'
  },
  innerCircle: {
    width: 140, height: 140,
    borderRadius: 70,
    backgroundColor: '#05A46D',
    justifyContent: 'center', alignItems: 'center',
    elevation: 10, shadowColor: '#05A46D', shadowOffset: { width: 0, height: 5 }, shadowOpacity: 0.4, shadowRadius: 10
  },
  statusText: { marginTop: 40, fontSize: 16, color: '#666', fontWeight: '500' }
});