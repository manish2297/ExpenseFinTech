import React, { useMemo, useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, SectionList, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { TransactionStore } from '../store';

const screenWidth = Dimensions.get('window').width;

export default function TransactionsHistoryScreen({ navigation }) {
  const [data, setData] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const unsub = TransactionStore.subscribe(newData => setData([...newData]));
    TransactionStore.load();
    return unsub;
  }, []);

  const grouped = useMemo(() => {
    const filtered = data.filter(t => t.title.toLowerCase().includes(searchQuery.toLowerCase()));
    const map = {};
    filtered.forEach(tx => {
      const parts = tx.date.split(' ');
      const key = `${parts[0]} ${parts[2]}`; 
      if (!map[key]) map[key] = { title: key, data: [], inc: 0, exp: 0 };
      map[key].data.push(tx);
      const val = Math.abs(parseFloat(tx.amount.replace(/[^\d.-]/g, ''))) || 0;
      if (tx.isExpense) map[key].exp += val; else map[key].inc += val;
    });
    return Object.values(map);
  }, [data, searchQuery]);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconButton}><Ionicons name="chevron-back" size={24} color="#333" /></TouchableOpacity>
        <Text style={styles.headerTitle}>Transactions history</Text>
        <TouchableOpacity style={styles.iconButton}><Ionicons name="calendar-outline" size={22} color="#666" /></TouchableOpacity>
      </View>

      <View style={styles.searchBarC}>
        <Ionicons name="search" size={20} color="#999" />
        <TextInput style={styles.searchInput} placeholder="Search" placeholderTextColor="#999" value={searchQuery} onChangeText={setSearchQuery} autoCorrect={false} />
        {searchQuery.length > 0 && <TouchableOpacity onPress={() => setSearchQuery('')}><Ionicons name="close-circle" size={18} color="#CCC" /></TouchableOpacity>}
      </View>

      <SectionList
        sections={grouped}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
        stickySectionHeadersEnabled={false}
        renderSectionHeader={({ section }) => (
          <View style={styles.monthHeader}>
            <Text style={styles.groupHeader}>{section.title}</Text>
            <View style={styles.monthlySummaryRow}>
              <View style={styles.pillGreen}><Ionicons name="arrow-down-outline" size={12} color="#05A46D" /><Text style={styles.pillTextIn}>{section.inc.toLocaleString('en-IN')}</Text></View>
              <View style={styles.pillRed}><Ionicons name="arrow-up-outline" size={12} color="#FF3B30" /><Text style={styles.pillTextOut}>{section.exp.toLocaleString('en-IN')}</Text></View>
            </View>
          </View>
        )}
        renderItem={({ item }) => (
          <View style={styles.transactionRow}>
            <View style={styles.transactionLeft}>
               <View style={[styles.transactionIconC, {backgroundColor: item.color + '15'}]}><Ionicons name={item.icon} size={20} color={item.color} /></View>
               <View><Text style={styles.rtTitle}>{item.title}</Text><Text style={styles.rtSubtitle}>{item.subtitle}</Text></View>
            </View>
            <View style={styles.transactionRight}>
               <Text style={[styles.rtAmount, {color: item.isExpense ? '#FF3B30' : '#05A46D'}]}>{item.amount}</Text>
               <Text style={styles.rtDate}>{item.date}</Text>
            </View>
          </View>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  header: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 10, paddingBottom: 15, alignItems: 'center' },
  iconButton: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 16, fontWeight: '700', color: '#333' },
  searchBarC: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F5F6F8', marginHorizontal: 20, marginBottom: 20, height: 48, borderRadius: 12, paddingHorizontal: 16 },
  searchInput: { flex: 1, marginLeft: 10, fontSize: 15, color: '#333', paddingVertical: 0, height: '100%' },
  monthHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10, marginBottom: 15 },
  groupHeader: { fontSize: 16, fontWeight: '700', color: '#222' },
  monthlySummaryRow: { flexDirection: 'row', alignItems: 'center' },
  pillGreen: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#E8F5E9', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 5, marginRight: 8 },
  pillTextIn: { fontSize: 11, fontWeight: '700', color: '#05A46D', marginLeft: 4 },
  pillRed: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFEBEE', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 5 },
  pillTextOut: { fontSize: 11, fontWeight: '700', color: '#FF3B30', marginLeft: 4 },
  transactionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  transactionLeft: { flexDirection: 'row', alignItems: 'center' },
  transactionIconC: { width: 42, height: 42, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  rtTitle: { fontSize: 14, fontWeight: '600', color: '#222' }, rtSubtitle: { fontSize: 11, color: '#999', marginTop: 2 },
  transactionRight: { alignItems: 'flex-end' },
  rtAmount: { fontSize: 14, fontWeight: '700', marginBottom: 2 }, rtDate: { fontSize: 10, color: '#CCC' }
});