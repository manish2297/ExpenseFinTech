import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { TransactionStore, WalletStore } from '../store';

const CATEGORIES = [
  { n: 'Add Money', i: 'wallet-outline', c: '#05A46D', inc: true },
  { n: 'Send', i: 'send-outline', c: '#007AFF', inc: false },
  { n: 'Transfer', i: 'swap-horizontal-outline', c: '#FF9500', inc: false },
  { n: 'Pay Bills', i: 'receipt-outline', c: '#FF3B30', inc: false },
  { n: 'Shopping', i: 'cart-outline', c: '#AF52DE', inc: false },
  { n: 'Food', i: 'restaurant-outline', c: '#FF2D55', inc: false },
];

export default function AddExpenseScreen({ navigation, route }) {
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [selectedCat, setSelectedCat] = useState(route.params?.prefilledCategory || null);
  const [date, setDate] = useState(new Date());
  const [show, setShow] = useState(false);
  
  const [wallets, setWallets] = useState([]);
  const [selectedWallet, setSelectedWallet] = useState(null);

  useEffect(() => {
    const unsub = WalletStore.subscribe(data => {
      setWallets(data);
      if (data.length > 0) setSelectedWallet(data[0]);
    });
    WalletStore.load();
    return unsub;
  }, []);

  const save = async () => {
    if (!selectedCat) return Alert.alert("Category", "Please choose a category.");
    if (!title || !amount) return Alert.alert("Missing", "Please fill in description and amount.");
    if (!selectedWallet) return Alert.alert("Wallet", "Please select a payment method.");
    
    const formattedDate = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    
    await TransactionStore.add({
      id: Math.random().toString(), timestamp: Date.now(),
      title, subtitle: selectedCat.n,
      amount: selectedCat.inc ? `+₹${amount}` : `-₹${amount}`,
      date: formattedDate, icon: selectedCat.i, color: selectedCat.c, isExpense: !selectedCat.inc,
      walletId: selectedWallet.id
    });

    await WalletStore.updateBalance(selectedWallet.id, amount, !selectedCat.inc);
    
    navigation.goBack();
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}><Ionicons name="close" size={28} color="#333" /></TouchableOpacity>
        <Text style={styles.title}>New Entry</Text>
        <View style={{ width: 28 }} />
      </View>
      <ScrollView style={{ padding: 20 }}>
        
        <Text style={styles.label}>Payment Method</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 20 }}>
          {wallets.map((w) => (
            <TouchableOpacity 
              key={w.id} 
              onPress={() => setSelectedWallet(w)} 
              style={[styles.chip, selectedWallet?.id === w.id && { backgroundColor: w.color, borderColor: w.color }]}
            >
              <Ionicons name="card-outline" size={18} color={selectedWallet?.id === w.id ? '#fff' : '#888'} />
              <Text style={[styles.chipT, selectedWallet?.id === w.id && { color: '#fff' }]}>{w.name}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <Text style={styles.label}>Category</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 20 }}>
          {CATEGORIES.map((c, index) => (
            <TouchableOpacity key={index} onPress={() => setSelectedCat(c)} style={[styles.chip, selectedCat?.n === c.n && { backgroundColor: c.c, borderColor: c.c }]}>
              <Ionicons name={c.i} size={18} color={selectedCat?.n === c.n ? '#fff' : c.c} />
              <Text style={[styles.chipT, selectedCat?.n === c.n && { color: '#fff' }]}>{c.n}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
        <TextInput style={styles.input} placeholder="Description" value={title} onChangeText={setTitle} />
        <TextInput style={styles.input} placeholder="Amount (₹)" keyboardType="numeric" value={amount} onChangeText={setAmount} />
        <TouchableOpacity style={styles.input} onPress={() => setShow(true)}><Text style={{color:'#333'}}>{date.toDateString()}</Text></TouchableOpacity>
        {show && <DateTimePicker value={date} mode="date" display="default" onChange={(e, d) => { setShow(false); if(d) setDate(d); }} />}
        <TouchableOpacity style={styles.btn} onPress={save}><Text style={styles.btnT}>Confirm</Text></TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', justifyContent: 'space-between', padding: 20, alignItems: 'center' },
  title: { fontSize: 18, fontWeight: 'bold', color: '#333' },
  label: { fontSize: 12, color: '#888', marginBottom: 10, fontWeight: '700' },
  input: { backgroundColor: '#F5F6F8', borderRadius: 16, padding: 18, marginBottom: 15, fontSize: 15, color: '#333' },
  chip: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 15, paddingVertical: 10, borderRadius: 20, borderWidth: 1, borderColor: '#EEE', marginRight: 10 },
  chipT: { marginLeft: 5, fontSize: 13, fontWeight: '600', color: '#555' },
  btn: { backgroundColor: '#05A46D', padding: 18, borderRadius: 16, alignItems: 'center', marginTop: 10, elevation: 2 },
  btnT: { color: '#fff', fontSize: 16, fontWeight: 'bold' }
});