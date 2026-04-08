import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity, Alert, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { TransactionStore, UserStore, WalletStore } from '../store';

const screenWidth = Dimensions.get('window').width;

const HOME_CATS = [
  { n: 'Send', mi: 'send', i: 'send-outline', c: '#007AFF', inc: false },
  { n: 'Transfer', mi: 'swap-horizontal', i: 'swap-horizontal-outline', c: '#FF9500', inc: false },
  { n: 'Pay Bills', mi: 'file-document-outline', i: 'receipt-outline', c: '#FF3B30', inc: false },
  { n: 'Shopping', mi: 'cart-outline', i: 'cart-outline', c: '#AF52DE', inc: false },
  { n: 'Food', mi: 'silverware-fork-knife', i: 'restaurant-outline', c: '#FF2D55', inc: false },
];

export default function HomeScreen({ navigation }) {
  const [transactions, setTransactions] = useState([]);
  const [user, setUser] = useState({ firstName: '...', avatar: 'https://randomuser.me/api/portraits/men/32.jpg' });
  const [wallets, setWallets] = useState([]);

  useEffect(() => {
    const unsubTx = TransactionStore.subscribe(data => setTransactions([...data]));
    const unsubUser = UserStore.subscribe(profile => setUser(profile));
    const unsubWallet = WalletStore.subscribe(data => setWallets([...data]));
    
    TransactionStore.load();
    UserStore.load();
    WalletStore.load();
    
    return () => { unsubTx(); unsubUser(); unsubWallet(); };
  }, []);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning!';
    if (hour < 17) return 'Good Afternoon!';
    if (hour < 21) return 'Good Evening!';
    return 'Good Night!';
  };

  const handleAddCard = () => {
    const colors = ['#1A1A1A', '#007AFF', '#AF52DE', '#FF3B30', '#FF9500'];
    const newCard = {
      id: Date.now().toString(),
      type: Math.random() > 0.5 ? 'VISA' : 'MASTERCARD',
      balance: Math.floor(Math.random() * 50000) + 1000,
      name: user.firstName ? `${user.firstName} Card` : 'Virtual Card',
      number: `**** **** **** ${Math.floor(1000 + Math.random() * 9000)}`,
      color: colors[Math.floor(Math.random() * colors.length)]
    };
    WalletStore.add(newCard);
  };

  const handleDeleteCard = (id) => {
    Alert.alert(
      "Remove Card",
      "Are you sure you want to delete this card?",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Delete", style: "destructive", onPress: () => WalletStore.delete(id) }
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 20 }}>
        
        <View style={styles.header}>
          <TouchableOpacity style={styles.userInfo} onPress={() => navigation.navigate('EditProfile')}>
            <Image source={{ uri: user.avatar || 'https://randomuser.me/api/portraits/men/32.jpg' }} style={styles.avatar} />
            <View><Text style={styles.greetTime}>{getGreeting()}</Text><Text style={styles.userName}>{user.firstName} 👋</Text></View>
          </TouchableOpacity>
          <View style={styles.headerRight}>
             {/* Navigates to Tap To Pay */}
             <TouchableOpacity style={styles.walletDropdown} onPress={() => navigation.navigate('TapToPay')}>
                <Ionicons name="wifi" size={18} color="#333" style={{ transform: [{ rotate: '90deg' }] }} />
             </TouchableOpacity>
             <TouchableOpacity style={styles.headerIconC} onPress={() => navigation.navigate('Stats')}>
                 <Ionicons name="pie-chart-outline" size={22} color="#333" />
             </TouchableOpacity>
          </View>
        </View>

        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false} 
          style={{ marginBottom: 30, paddingRight: 20 }}
          snapToInterval={screenWidth * 0.8 + 15}
          decelerationRate="fast"
        >
          {wallets.map((wallet) => (
            <TouchableOpacity 
              key={wallet.id} 
              activeOpacity={0.9}
              onLongPress={() => handleDeleteCard(wallet.id)}
              style={[styles.creditCard, { backgroundColor: wallet.color }]}
            >
              <View style={styles.cardHeader}>
                <Text style={styles.cardType}>{wallet.type}</Text>
                <Ionicons name="card" size={24} color="rgba(255,255,255,0.5)" />
              </View>
              
              <Text style={styles.cardBalanceLabel}>Balance</Text>
              <Text style={styles.cardBalance}>₹ {wallet.balance.toLocaleString('en-IN')}</Text>
              
              <View style={styles.cardFooter}>
                <Text style={styles.cardName}>{wallet.name}</Text>
                <Text style={styles.cardNumber}>{wallet.number}</Text>
              </View>
            </TouchableOpacity>
          ))}
          
          <TouchableOpacity style={styles.addCardBtn} onPress={handleAddCard}>
            <Ionicons name="add-circle-outline" size={32} color="#888" />
            <Text style={{ color: '#888', marginTop: 5, fontSize: 12, fontWeight: '600' }}>Add Card</Text>
          </TouchableOpacity>
        </ScrollView>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>By Categories</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Stats')}><Text style={styles.seeAll}>Stats</Text></TouchableOpacity>
        </View>
        
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.catScroll}>
          {HOME_CATS.map((cat, index) => (
             <TouchableOpacity key={index} style={styles.catItem} onPress={() => navigation.navigate('AddExpense', { prefilledCategory: cat })}>
                <View style={styles.catIconC}><MaterialCommunityIcons name={cat.mi} size={24} color="#05A46D" /></View>
                <Text style={styles.catText}>{cat.n}</Text>
             </TouchableOpacity>
          ))}
        </ScrollView>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recent Transactions</Text>
          <TouchableOpacity onPress={() => navigation.navigate('TransactionsHistory')}><Text style={styles.seeAll}>See all</Text></TouchableOpacity>
        </View>

        {transactions.slice(0, 5).map(item => (
          <TouchableOpacity key={item.id} onLongPress={() => Alert.alert("Delete", "Remove entry?", [{ text: "Cancel" }, { text: "Delete", style: "destructive", onPress: () => TransactionStore.delete(item.id) }])} style={styles.transactionRow}>
            <View style={styles.transactionLeft}>
               <View style={[styles.transactionIconC, {backgroundColor: item.color + '15'}]}><Ionicons name={item.icon} size={20} color={item.color} /></View>
               <View><Text style={styles.rtTitle}>{item.title}</Text><Text style={styles.rtSubtitle}>{item.subtitle}</Text></View>
            </View>
            <View style={styles.transactionRight}>
               <Text style={[styles.rtAmount, {color: item.isExpense ? '#FF3B30' : '#05A46D'}]}>{item.amount}</Text>
               <Text style={styles.rtDate}>{item.date}</Text>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
      <TouchableOpacity style={styles.fab} onPress={() => navigation.navigate('AddExpense')}><Ionicons name="add" size={32} color="#fff" /></TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 30 },
  userInfo: { flexDirection: 'row', alignItems: 'center' },
  avatar: { width: 45, height: 45, borderRadius: 22.5, marginRight: 12 },
  userName: { fontSize: 16, fontWeight: '700', color: '#333' }, greetTime: { fontSize: 11, color: '#888', marginBottom: 2 },
  headerRight: { flexDirection: 'row', alignItems: 'center' },
  walletDropdown: { width: 32, height: 32, backgroundColor: '#F5F6F8', borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  headerIconC: { width: 32, height: 32, justifyContent: 'center', alignItems: 'center' },
  creditCard: { width: screenWidth * 0.8, height: 180, borderRadius: 24, padding: 20, marginRight: 15, justifyContent: 'space-between', elevation: 4 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardType: { color: 'rgba(255,255,255,0.8)', fontSize: 13, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 1 },
  cardBalanceLabel: { color: 'rgba(255,255,255,0.6)', fontSize: 11, marginTop: 15 },
  cardBalance: { color: '#fff', fontSize: 28, fontWeight: 'bold', marginBottom: 10 },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardName: { color: '#fff', fontSize: 14, fontWeight: '500' },
  cardNumber: { color: 'rgba(255,255,255,0.7)', fontSize: 14, letterSpacing: 2 },
  addCardBtn: { width: 120, height: 180, borderRadius: 24, borderWidth: 2, borderColor: '#EEE', borderStyle: 'dashed', justifyContent: 'center', alignItems: 'center', marginRight: 20 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 15, marginBottom: 15, alignItems: 'center' },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#333' }, seeAll: { fontSize: 12, color: '#888' },
  catScroll: { marginBottom: 25 }, catItem: { alignItems: 'center', marginRight: 22 },
  catIconC: { width: 56, height: 56, borderRadius: 16, backgroundColor: '#F5F6F8', justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
  catText: { fontSize: 11, color: '#666', fontWeight: '500' },
  transactionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  transactionLeft: { flexDirection: 'row', alignItems: 'center' },
  transactionIconC: { width: 42, height: 42, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  rtTitle: { fontSize: 14, fontWeight: '600', color: '#222' }, rtSubtitle: { fontSize: 11, color: '#999', marginTop: 2 },
  transactionRight: { alignItems: 'flex-end' },
  rtAmount: { fontSize: 14, fontWeight: '700', marginBottom: 2 }, rtDate: { fontSize: 10, color: '#CCC' },
  fab: { position: 'absolute', bottom: 30, right: 20, width: 60, height: 60, borderRadius: 30, backgroundColor: '#05A46D', justifyContent: 'center', alignItems: 'center', elevation: 5 }
});