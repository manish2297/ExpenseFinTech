import AsyncStorage from '@react-native-async-storage/async-storage';

export const TransactionStore = {
  data: [], listeners: [],
  async load() {
    const saved = await AsyncStorage.getItem('user_tx_v3');
    if (saved) this.data = JSON.parse(saved);
    this.notify();
  },
  async add(tx) {
    this.data = [tx, ...this.data];
    await AsyncStorage.setItem('user_tx_v3', JSON.stringify(this.data));
    this.notify();
  },
  async delete(id) {
    this.data = this.data.filter(t => t.id !== id);
    await AsyncStorage.setItem('user_tx_v3', JSON.stringify(this.data));
    this.notify();
  },
  async grantSmsPermission() {
    await AsyncStorage.setItem('permission_sms', 'true');
  },
  subscribe(callback) {
    this.listeners.push(callback);
    return () => { this.listeners = this.listeners.filter(l => l !== callback); };
  },
  notify() { this.listeners.forEach(cb => cb(this.data)); }
};

export const UserStore = {
  profile: { firstName: 'John', lastName: 'Doe', dob: 'Jan 1, 1995', avatar: 'https://randomuser.me/api/portraits/men/32.jpg' },
  listeners: [],
  async load() {
    const saved = await AsyncStorage.getItem('user_profile_v2');
    if (saved) this.profile = JSON.parse(saved);
    this.notify();
  },
  async update(newProfile) {
    this.profile = { ...this.profile, ...newProfile };
    await AsyncStorage.setItem('user_profile_v2', JSON.stringify(this.profile));
    this.notify();
  },
  subscribe(callback) {
    this.listeners.push(callback);
    return () => { this.listeners = this.listeners.filter(l => l !== callback); };
  },
  notify() { this.listeners.forEach(cb => cb(this.profile)); }
};

export const AuthStore = {
  async getPin() {
    return await AsyncStorage.getItem('user_pin');
  },
  async savePin(pin) {
    await AsyncStorage.setItem('user_pin', pin);
  },
  async logout() {
    await AsyncStorage.removeItem('user_pin');
  }
};

export const WalletStore = {
  data: [
    { id: '1', name: 'Main Bank', type: 'Bank', balance: 24500, color: '#1C1C1E', number: '**** 1234' },
    { id: '2', name: 'Credit Card', type: 'Credit', balance: -4500, color: '#05A46D', number: '**** 9876' },
  ],
  listeners: [],
  
  async load() {
    const saved = await AsyncStorage.getItem('user_wallets_v1');
    if (saved) {
        this.data = JSON.parse(saved);
    }
    this.notify();
  },
  
  async add(wallet) {
    this.data = [...this.data, wallet];
    await AsyncStorage.setItem('user_wallets_v1', JSON.stringify(this.data));
    this.notify();
  },

  async delete(id) {
    this.data = this.data.filter(w => w.id !== id);
    await AsyncStorage.setItem('user_wallets_v1', JSON.stringify(this.data));
    this.notify();
  },

  async updateBalance(walletId, amount, isExpense) {
    this.data = this.data.map(w => {
      if (w.id === walletId) {
        const numAmount = Math.abs(parseFloat(amount.replace(/[^\d.-]/g, '')));
        const newBalance = isExpense ? w.balance - numAmount : w.balance + numAmount;
        return { ...w, balance: newBalance };
      }
      return w;
    });
    await AsyncStorage.setItem('user_wallets_v1', JSON.stringify(this.data));
    this.notify();
  },

  subscribe(callback) {
    this.listeners.push(callback);
    return () => { this.listeners = this.listeners.filter(l => l !== callback); };
  },
  
  notify() { this.listeners.forEach(cb => cb(this.data)); }
};