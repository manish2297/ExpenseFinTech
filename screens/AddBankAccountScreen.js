import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { WalletStore, UserStore } from '../store';

const screenWidth = Dimensions.get('window').width;

const POPULAR_BANKS = [
  { name: 'HDFC Bank', code: 'HDFC', ifscPrefix: 'HDFC000', color: '#1A237E' },
  { name: 'SBI', code: 'SBIN', ifscPrefix: 'SBIN000', color: '#0D47A1' },
  { name: 'ICICI Bank', code: 'ICIC', ifscPrefix: 'ICIC000', color: '#880E4F' },
  { name: 'Axis Bank', code: 'UTIB', ifscPrefix: 'UTIB000', color: '#4A148C' },
  { name: 'Kotak Bank', code: 'KKBK', ifscPrefix: 'KKBK000', color: '#B71C1C' },
  { name: 'PNB', code: 'PUNB', ifscPrefix: 'PUNB000', color: '#E65100' },
  { name: 'Bank of Baroda', code: 'BARB', ifscPrefix: 'BARB000', color: '#BF360C' },
];

const ACCOUNT_TYPES = ['Savings', 'Current', 'Salary'];

const BANK_THEMES = [
  '#1C1C1E', // Obsidian
  '#1A237E', // Deep Navy
  '#05A46D', // Emerald Fintech
  '#4A148C', // Royal Indigo
  '#880E4F', // Burgundy
  '#00695C', // Deep Teal
];

export default function AddBankAccountScreen({ navigation }) {
  const [bankName, setBankName] = useState('');
  const [accountType, setAccountType] = useState('Savings');
  const [accountNumber, setAccountNumber] = useState('');
  const [confirmAccountNumber, setConfirmAccountNumber] = useState('');
  const [ifsc, setIfsc] = useState('');
  const [holderName, setHolderName] = useState('');
  const [balance, setBalance] = useState('50000');
  const [selectedColor, setSelectedColor] = useState(BANK_THEMES[1]);

  useEffect(() => {
    if (UserStore.profile?.firstName) {
      const full = `${UserStore.profile.firstName} ${UserStore.profile.lastName || ''}`.trim().toUpperCase();
      if (!holderName) {
        setHolderName(full);
      }
    }
  }, []);

  // Quick select a bank preset
  const selectBankPreset = (bank) => {
    setBankName(bank.name);
    if (!ifsc || ifsc.length < 4) {
      setIfsc(bank.ifscPrefix);
    }
    setSelectedColor(bank.color);
  };

  // Auto-detect bank from IFSC
  const handleIfscChange = (text) => {
    const upper = text.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 11);
    setIfsc(upper);

    if (upper.length >= 4) {
      const prefix = upper.slice(0, 4);
      const match = POPULAR_BANKS.find(b => b.code === prefix);
      if (match && !bankName) {
        setBankName(match.name);
        setSelectedColor(match.color);
      }
    }
  };

  // Mask display number
  const maskedDisplay = accountNumber
    ? `•••• •••• ${accountNumber.slice(-4)}`
    : '•••• •••• •••• ••••';

  const isAccountMatch =
    accountNumber.length > 0 &&
    confirmAccountNumber.length > 0 &&
    accountNumber === confirmAccountNumber;

  // Save Bank Account
  const handleSaveAccount = async () => {
    if (!bankName.trim()) {
      return Alert.alert('Missing Bank', 'Please enter or select your bank name.');
    }
    if (accountNumber.length < 8) {
      return Alert.alert('Invalid Account Number', 'Account number must be at least 8 digits.');
    }
    if (accountNumber !== confirmAccountNumber) {
      return Alert.alert('Mismatch', 'Account numbers do not match. Please verify.');
    }
    if (!ifsc.trim() || ifsc.length < 4) {
      return Alert.alert('Invalid IFSC', 'Please enter a valid IFSC code (e.g. HDFC0001234).');
    }
    if (!holderName.trim()) {
      return Alert.alert('Missing Name', 'Please enter account holder name.');
    }

    const cleanBalance = parseFloat(balance.replace(/[^\d.-]/g, '')) || 0;
    const last4 = accountNumber.slice(-4);

    const newAccount = {
      id: Date.now().toString(),
      name: `${bankName.trim()}`,
      holderName: holderName.trim(),
      type: 'Bank',
      accountType: accountType,
      balance: cleanBalance,
      color: selectedColor,
      number: `**** ${last4}`,
      fullNumber: accountNumber,
      ifsc: ifsc.trim().toUpperCase(),
    };

    await WalletStore.add(newAccount);
    Alert.alert('Success', `${bankName} added to your accounts!`, [
      { text: 'OK', onPress: () => navigation.goBack() },
    ]);
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#1C1C1E" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Add Bank Account</Text>
        <TouchableOpacity
          style={styles.switchModeBtn}
          onPress={() => navigation.navigate('AddCard')}
        >
          <Ionicons name="card-outline" size={20} color="#05A46D" />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Passbook / Bank Card Preview */}
        <View style={[styles.bankPreview, { backgroundColor: selectedColor }]}>
          <View style={styles.previewTop}>
            <View style={styles.bankBadgeRow}>
              <View style={styles.bankIconContainer}>
                <Ionicons name="business" size={20} color="#FFFFFF" />
              </View>
              <View style={{ marginLeft: 10 }}>
                <Text style={styles.previewBankName}>
                  {bankName ? bankName : 'YOUR BANK'}
                </Text>
                <Text style={styles.previewAccountType}>
                  {accountType.toUpperCase()} ACCOUNT
                </Text>
              </View>
            </View>
            <View style={styles.verifiedPill}>
              <Ionicons name="checkmark-circle" size={14} color="#05A46D" style={{ marginRight: 3 }} />
              <Text style={styles.verifiedText}>Verified</Text>
            </View>
          </View>

          {/* Account Number */}
          <Text style={styles.previewAccountNumber}>{maskedDisplay}</Text>

          {/* Footer Details */}
          <View style={styles.previewFooter}>
            <View style={{ flex: 1 }}>
              <Text style={styles.previewLabel}>ACCOUNT HOLDER</Text>
              <Text style={styles.previewValue} numberOfLines={1}>
                {holderName ? holderName.toUpperCase() : 'ACCOUNT HOLDER NAME'}
              </Text>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={styles.previewLabel}>IFSC CODE</Text>
              <Text style={styles.previewValue}>
                {ifsc ? ifsc : '•••••••••••'}
              </Text>
            </View>
          </View>
        </View>

        {/* Popular Banks Chips */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Select Bank</Text>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.bankScroll}>
          {POPULAR_BANKS.map((b, idx) => {
            const isSelected = bankName === b.name;
            return (
              <TouchableOpacity
                key={idx}
                style={[styles.bankChip, isSelected && styles.bankChipSelected]}
                onPress={() => selectBankPreset(b)}
              >
                <Ionicons
                  name="business-outline"
                  size={15}
                  color={isSelected ? '#FFFFFF' : '#05A46D'}
                  style={{ marginRight: 6 }}
                />
                <Text style={[styles.bankChipText, isSelected && styles.bankChipTextSelected]}>
                  {b.name}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Form Container */}
        <View style={styles.formCard}>
          {/* Bank Name Input */}
          <Text style={styles.inputLabel}>Bank Name</Text>
          <View style={styles.inputWrapper}>
            <Ionicons name="business-outline" size={20} color="#888888" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="e.g. HDFC Bank, SBI, ICICI"
              placeholderTextColor="#888888"
              value={bankName}
              onChangeText={setBankName}
            />
          </View>

          {/* Account Type Selector */}
          <Text style={styles.inputLabel}>Account Type</Text>
          <View style={styles.accountTypeRow}>
            {ACCOUNT_TYPES.map((type) => {
              const active = accountType === type;
              return (
                <TouchableOpacity
                  key={type}
                  style={[styles.typeBtn, active && styles.typeBtnActive]}
                  onPress={() => setAccountType(type)}
                >
                  <Text style={[styles.typeBtnText, active && styles.typeBtnTextActive]}>
                    {type}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Account Number */}
          <Text style={styles.inputLabel}>Account Number</Text>
          <View style={styles.inputWrapper}>
            <Ionicons name="keypad-outline" size={20} color="#888888" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Enter 9 to 18 digit account number"
              placeholderTextColor="#888888"
              value={accountNumber}
              onChangeText={setAccountNumber}
              keyboardType="number-pad"
              maxLength={18}
            />
          </View>

          {/* Confirm Account Number */}
          <Text style={styles.inputLabel}>Confirm Account Number</Text>
          <View style={styles.inputWrapper}>
            <Ionicons name="shield-checkmark-outline" size={20} color="#888888" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Re-enter account number"
              placeholderTextColor="#888888"
              value={confirmAccountNumber}
              onChangeText={setConfirmAccountNumber}
              keyboardType="number-pad"
              maxLength={18}
            />
            {isAccountMatch && (
              <Ionicons name="checkmark-circle" size={20} color="#05A46D" />
            )}
          </View>

          {/* IFSC Code */}
          <Text style={styles.inputLabel}>IFSC Code</Text>
          <View style={styles.inputWrapper}>
            <Ionicons name="barcode-outline" size={20} color="#888888" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="e.g. HDFC0001234"
              placeholderTextColor="#888888"
              value={ifsc}
              onChangeText={handleIfscChange}
              autoCapitalize="characters"
              autoCorrect={false}
              maxLength={11}
            />
          </View>

          {/* Account Holder Name */}
          <Text style={styles.inputLabel}>Account Holder Name</Text>
          <View style={styles.inputWrapper}>
            <Ionicons name="person-outline" size={20} color="#888888" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="e.g. RAHUL SHARMA"
              placeholderTextColor="#888888"
              value={holderName}
              onChangeText={setHolderName}
              autoCapitalize="characters"
              autoCorrect={false}
            />
          </View>

          {/* Initial Balance */}
          <Text style={styles.inputLabel}>Initial Available Balance (₹)</Text>
          <View style={styles.inputWrapper}>
            <Text style={styles.currencyPrefix}>₹</Text>
            <TextInput
              style={styles.input}
              placeholder="50,000"
              placeholderTextColor="#888888"
              value={balance}
              onChangeText={setBalance}
              keyboardType="numeric"
            />
          </View>

          {/* Theme Palette */}
          <Text style={styles.inputLabel}>Account Color Theme</Text>
          <View style={styles.colorPalette}>
            {BANK_THEMES.map((c, i) => {
              const isSelected = selectedColor === c;
              return (
                <TouchableOpacity
                  key={i}
                  style={[
                    styles.colorCircle,
                    { backgroundColor: c },
                    isSelected && styles.colorCircleSelected,
                  ]}
                  onPress={() => setSelectedColor(c)}
                >
                  {isSelected && <Ionicons name="checkmark" size={16} color="#FFFFFF" />}
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Save Account Button */}
          <TouchableOpacity style={styles.saveBtn} activeOpacity={0.8} onPress={handleSaveAccount}>
            <Ionicons name="checkmark-done" size={20} color="#FFFFFF" style={{ marginRight: 8 }} />
            <Text style={styles.saveBtnText}>Save Bank Account</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1C1C1E',
  },
  switchModeBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E8F5E9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },

  /* Preview Card */
  bankPreview: {
    width: '100%',
    height: 190,
    borderRadius: 20,
    padding: 20,
    justifyContent: 'space-between',
    elevation: 6,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 5 },
    shadowRadius: 8,
    marginBottom: 20,
  },
  previewTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  bankBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  bankIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewBankName: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  previewAccountType: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.8,
    marginTop: 2,
  },
  verifiedPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  verifiedText: {
    color: '#05A46D',
    fontSize: 11,
    fontWeight: '700',
  },
  previewAccountNumber: {
    color: '#FFFFFF',
    fontSize: 21,
    fontWeight: '700',
    letterSpacing: 3,
    textAlign: 'center',
  },
  previewFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  previewLabel: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.8,
    marginBottom: 2,
  },
  previewValue: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
  },

  /* Bank presets */
  sectionHeader: {
    marginBottom: 10,
    marginLeft: 2,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#666',
  },
  bankScroll: {
    marginBottom: 20,
  },
  bankChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    marginRight: 10,
    borderWidth: 1.2,
    borderColor: '#E5E7EB',
  },
  bankChipSelected: {
    backgroundColor: '#05A46D',
    borderColor: '#05A46D',
  },
  bankChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#333',
  },
  bankChipTextSelected: {
    color: '#FFFFFF',
  },

  /* Form */
  formCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#4B5563',
    marginBottom: 6,
    marginLeft: 2,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 14,
    paddingHorizontal: 14,
    marginBottom: 16,
    height: 52,
  },
  inputIcon: {
    marginRight: 10,
  },
  currencyPrefix: {
    fontSize: 18,
    fontWeight: '700',
    color: '#05A46D',
    marginRight: 8,
  },
  input: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: '#1C1C1E',
  },

  /* Account Type pills */
  accountTypeRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  typeBtn: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  typeBtnActive: {
    backgroundColor: '#E8F5E9',
    borderColor: '#05A46D',
  },
  typeBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#666',
  },
  typeBtnTextActive: {
    color: '#05A46D',
    fontWeight: '700',
  },

  /* Color Palette */
  colorPalette: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
    marginTop: 4,
  },
  colorCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  colorCircleSelected: {
    borderWidth: 3,
    borderColor: '#FFFFFF',
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
  },

  /* Save Button */
  saveBtn: {
    flexDirection: 'row',
    backgroundColor: '#05A46D',
    borderRadius: 16,
    height: 54,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 3,
    shadowColor: '#05A46D',
    shadowOpacity: 0.3,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
  },
  saveBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});
