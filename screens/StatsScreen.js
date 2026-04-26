import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Dimensions, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { PieChart, BarChart } from "react-native-chart-kit";
import { TransactionStore } from '../store';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';

const screenWidth = Dimensions.get("window").width;

export default function StatsScreen({ navigation }) {
  const [transactions, setTransactions] = useState([]);

  useEffect(() => {
    const unsub = TransactionStore.subscribe(data => setTransactions([...data]));
    TransactionStore.load();
    return unsub;
  }, []);

  const expenses = transactions.filter(t => t.isExpense);

  const exportToCSV = async () => {
    try {
      const txData = TransactionStore.data;
      if (txData.length === 0) {
        Alert.alert("Empty", "No transactions to export!");
        return;
      }

      let csvString = "Date,Title,Category,Amount,Type\n";
      txData.forEach(tx => {
        const cleanAmount = tx.amount.replace(/[^\d.-]/g, '');
        const type = tx.isExpense ? "Debit" : "Credit";
        csvString += `${tx.date},${tx.title},${tx.subtitle},${cleanAmount},${type}\n`;
      });

      const fileUri = FileSystem.documentDirectory + "Monthly_Ledger.csv";
      await FileSystem.writeAsStringAsync(fileUri, csvString, { encoding: FileSystem.EncodingType.UTF8 });

      await Sharing.shareAsync(fileUri, {
        mimeType: 'text/csv',
        dialogTitle: 'Export Ledger',
        UTI: 'public.comma-separated-values-text'
      });
    } catch (error) {
      console.error("Export failed:", error);
      Alert.alert("Error", "Failed to export data.");
    }
  };

  const catMap = {};
  expenses.forEach(t => { 
    const amount = Math.abs(parseFloat(t.amount.replace(/[^\d.-]/g, '')));
    catMap[t.subtitle] = (catMap[t.subtitle] || 0) + amount; 
  });
  
  const pieData = Object.keys(catMap).map((key, i) => ({ 
    name: key, 
    population: catMap[key], 
    color: ['#05A46D', '#1C1C1E', '#FF9500', '#FF3B30', '#AF52DE'][i % 5], 
    legendFontColor: "#7F7F7F", 
    legendFontSize: 12 
  }));

  const dayMap = {};
  expenses.slice(0, 7).forEach(t => { 
    const shortDate = t.date.split(',')[0]; 
    const amount = Math.abs(parseFloat(t.amount.replace(/[^\d.-]/g, '')));
    dayMap[shortDate] = (dayMap[shortDate] || 0) + amount; 
  });
  
  const barData = { 
    labels: Object.keys(dayMap).length > 0 ? Object.keys(dayMap).reverse() : ["No Data"], 
    datasets: [{ data: Object.keys(dayMap).length > 0 ? Object.values(dayMap).reverse() : [0] }] 
  };

  const chartConfig = { 
    backgroundGradientFrom: "#fff", 
    backgroundGradientTo: "#fff", 
    color: (opacity = 1) => `rgba(5, 164, 109, ${opacity})`, 
    labelColor: () => `#666`, 
    decimalPlaces: 0 
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Analytics</Text>
        
        {/* Export to CSV Button */}
        <TouchableOpacity onPress={exportToCSV} style={styles.backBtn}>
          <Ionicons name="download-outline" size={22} color="#05A46D" />
        </TouchableOpacity>
      </View>
      
      <ScrollView showsVerticalScrollIndicator={false}>
        {expenses.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="bar-chart-outline" size={64} color="#EEE" />
            <Text style={styles.emptyText}>Add some expenses to see patterns!</Text>
          </View>
        ) : (
          <View style={styles.content}>
            <Text style={styles.chartHeading}>Spending by Category</Text>
            <View style={styles.chartCard}>
              <PieChart 
                data={pieData} 
                width={screenWidth - 40} 
                height={200} 
                chartConfig={chartConfig} 
                accessor={"population"} 
                backgroundColor={"transparent"} 
                paddingLeft={"15"} 
                absolute 
              />
            </View>
            
            <Text style={styles.chartHeading}>Recent Trends</Text>
            <View style={styles.chartCard}>
              <BarChart 
                data={barData} 
                width={screenWidth - 70} 
                height={220} 
                yAxisLabel="₹" 
                chartConfig={chartConfig} 
                style={{ marginVertical: 8, borderRadius: 16 }} 
                flatColor={true} 
                fromZero={true} 
              />
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20 }, 
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#333' },
  backBtn: { width: 40, height: 40, borderRadius: 12, backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center', elevation: 2 },
  content: { paddingHorizontal: 20, paddingBottom: 40 }, 
  chartHeading: { fontSize: 16, fontWeight: '700', color: '#333', marginTop: 20, marginBottom: 15 },
  chartCard: { backgroundColor: '#fff', borderRadius: 24, padding: 15, elevation: 3, marginBottom: 10, alignItems: 'center' },
  emptyContainer: { alignItems: 'center', marginTop: 100, padding: 40 }, 
  emptyText: { textAlign: 'center', color: '#AAA', marginTop: 20, fontSize: 14 }
});