import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, PermissionsAndroid, Platform, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { TransactionStore } from '../store';

export default function SmsPermissionScreen({ onGrant }) {
  
  const requestRealSmsPermission = async () => {
    
    // 🚨 DEVELOPMENT BYPASS: 
    // Since Expo Go cannot show SMS popups, we will fake a successful grant here 
    // so you can actually test the rest of your app!
    // NOTE: Delete these next 3 lines when you are ready to build the real APK.
    console.log("DEV MODE: Bypassing native SMS check for Expo Go.");
    await TransactionStore.grantSmsPermission();
    return onGrant(); 
    // --------------------------------------------------------------------------

    if (Platform.OS !== 'android') {
      Alert.alert("Not Supported", "SMS reading is only available on Android.");
      return;
    }

    try {
      const granted = await PermissionsAndroid.requestMultiple([
        PermissionsAndroid.PERMISSIONS.READ_SMS,
        PermissionsAndroid.PERMISSIONS.RECEIVE_SMS
      ]);

      if (
        granted[PermissionsAndroid.PERMISSIONS.READ_SMS] === PermissionsAndroid.RESULTS.GRANTED &&
        granted[PermissionsAndroid.PERMISSIONS.RECEIVE_SMS] === PermissionsAndroid.RESULTS.GRANTED
      ) {
        await TransactionStore.grantSmsPermission();
        onGrant(); 
      } else {
        Alert.alert(
          "Permission Denied", 
          "We need both Read and Receive permissions to fully automate your expense tracking."
        );
      }
    } catch (err) {
      console.warn("Permission Error:", err);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>SMS Permission</Text>
        <Text style={styles.subtitle}>We respect your privacy. No details are shared anywhere.</Text>
        
        <View style={styles.graphicContainer}>
          <View style={styles.graphicImage}>
            <View style={styles.mockPhone} />
          </View>
        </View>
        
        <View style={styles.paginationDots}>
          <View style={styles.dotActive} />
          <View style={styles.dot} />
          <View style={styles.dot} />
        </View>
      </View>
      
      <TouchableOpacity style={styles.primaryButton} onPress={requestRealSmsPermission}>
        <Text style={styles.primaryButtonText}>Grant SMS Permission</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

// ... Keep your existing styles at the bottom ...
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF', paddingBottom: 30 },
  content: { flex: 1, padding: 25, alignItems: 'center' },
  title: { fontSize: 24, fontWeight: '700', color: '#1C1C1E', marginTop: 50, marginBottom: 15 },
  subtitle: { fontSize: 14, color: '#666666', textAlign: 'center', lineHeight: 22, paddingHorizontal: 30, marginBottom: 40 },
  graphicContainer: { flex: 1, justifyContent: 'center' },
  graphicImage: { width: 280, height: 380, borderRadius: 20, backgroundColor: '#F8F9FA', elevation: 1 },
  mockPhone: { width: '80%', height: '80%', backgroundColor: '#fff', borderRadius: 10, alignSelf: 'center', marginTop: 40, borderTopWidth: 1, borderColor: '#DDD' },
  paginationDots: { flexDirection: 'row', justifyContent: 'center', marginTop: 40 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#DDD', marginHorizontal: 5 },
  dotActive: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#05A46D', marginHorizontal: 5 },
  primaryButton: { backgroundColor: '#05A46D', padding: 18, borderRadius: 16, width: '90%', alignSelf: 'center', alignItems: 'center', elevation: 2 },
  primaryButtonText: { color: '#fff', fontSize: 16, fontWeight: '700' }
});