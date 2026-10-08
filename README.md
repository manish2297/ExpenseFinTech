# ExpenseFinTech 💳📊

A modern, high-performance personal finance and expense tracking mobile application built with **React Native**, **Expo SDK 54**, and **React 19**. Featuring interactive virtual card wallets, simulated Tap-to-Pay (NFC), SMS-based automated tracking permissions, rich chart analytics, and secure local-first storage.

---

## 🚀 Overview

**ExpenseFinTech** gives users full control over their personal finances through an intuitive, bank-grade interface. From tracking daily spending and managing multi-account balances to viewing categorized spending breakdowns and exporting monthly ledgers to CSV, the app provides a complete fintech experience designed for speed, privacy, and offline reliability.

---

## ✨ Key Features

- **🔐 PIN-Protected Security**:
  - Secure 4-digit PIN setup and authentication flow.
  - Persistent login state stored securely on-device.

- **💳 Multi-Wallet & Virtual Cards**:
  - Manage multiple bank accounts, credit cards, and virtual cards with live balance recalculation.
  - Interactive credit card preview with customizable color themes.

- **📷 Card Scanner & OCR Auto-Extraction**:
  - Scan physical cards using device camera (`expo-camera`) or photo gallery (`expo-image-picker`).
  - Viewfinder with animated laser scan beam and corner guides.
  - OCR extraction engine auto-detects card number, cardholder name, expiry date, and card brand (Visa, Mastercard, RuPay, Amex).
  - Manual input mode with real-time card formatting, Luhn/IIN brand detection, and quick-fill sample presets.

- **💸 Comprehensive Expense & Income Logging**:
  - Categorized transactions (Food, Shopping, Pay Bills, Transfer, Send, Add Money).
  - Date & time picker, custom description, and wallet/account selection.

- **📶 Tap-to-Pay (NFC Simulation)**:
  - Smooth animated radar pulse interface simulating contactless payment.
  - Instant balance deduction and transaction logging upon simulated reader contact.

- **📊 Visual Financial Analytics**:
  - Interactive **Pie Chart** for spending distribution by category.
  - Trend **Bar Chart** visualizing monthly expense flow.
  - Powered by `react-native-chart-kit` and `react-native-svg`.

- **📁 Ledger CSV Export & Sharing**:
  - One-tap monthly financial ledger generation formatted in clean RFC-compliant CSV.
  - Native OS sharing integration via `expo-sharing` and `expo-file-system`.

- **📜 Transaction History & Smart Search**:
  - Search transactions instantly by title or keyword.
  - Automatically grouped by month with aggregate income and expense totals.

- **📩 SMS Permission Onboarding**:
  - Dedicated Android SMS permission handling (`READ_SMS`, `RECEIVE_SMS`) ready for automated transaction scraping and alert parsing.

- **👤 Profile & Avatar Customization**:
  - Edit personal details and date of birth.
  - Avatar image upload directly from the device library via `expo-image-picker`.

- **⚡ Local-First & Offline Architecture**:
  - Powered by an event-driven pub/sub store (`store.js`) backed by `@react-native-async-storage/async-storage`.
  - Zero external database requirements to run out-of-the-box.

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| **Framework** | [React Native](https://reactnative.dev/) `0.81.5` with [React](https://react.dev/) `19.1.0` |
| **Tooling & Runtime** | [Expo SDK 54](https://expo.dev/) (Prebuild / Bare workflow supported) |
| **Navigation** | [React Navigation 7](https://reactnavigation.org/) (`@react-navigation/native`, `@react-navigation/native-stack`) |
| **State & Storage** | Pub/Sub State Pattern + [@react-native-async-storage/async-storage](https://react-native-async-storage.github.io/async-storage/) |
| **Data Visualization** | `react-native-chart-kit`, `react-native-svg` |
| **Device & Media APIs**| `expo-image-picker`, `expo-file-system`, `expo-sharing`, `@react-native-community/datetimepicker` |
| **Icons & UI** | `@expo/vector-icons` (`Ionicons`, `MaterialCommunityIcons`), `react-native-safe-area-context` |
| **Cloud Build** | [Expo Application Services (EAS)](https://expo.dev/eas) |

---

## 📂 Project Architecture

```text
ExpenseFinTech/
├── App.js                         # Root application, authentication gate & navigation stack
├── app.json                       # Expo config, permissions (SMS), Android SDK targets (35)
├── eas.json                       # EAS Build profile configuration (dev, preview APK, prod)
├── index.js                       # Expo root registration entry point
├── package.json                   # Dependencies & npm scripts
├── store.js                       # Reactive state stores (TransactionStore, WalletStore, UserStore, AuthStore)
│
├── screens/
│   ├── LoginScreen.js             # 4-digit PIN authentication & creation
│   ├── SmsPermissionScreen.js     # Android SMS permission onboarding
│   ├── HomeScreen.js              # Main dashboard, greeting, card carousel & quick actions
│   ├── AddCardScreen.js           # Card addition with OCR camera scanner & manual entry
│   ├── AddExpenseScreen.js        # Transaction creation with wallet & category picker
│   ├── TransactionsHistoryScreen.js # Grouped transaction history & instant search
│   ├── StatsScreen.js             # Charts, analytics breakdown & CSV export
│   ├── TapToPayScreen.js          # Animated NFC contactless payment simulation
│   └── EditProfileScreen.js       # User profile details and avatar picker
│
├── utils/
│   └── cardScanner.js             # Card OCR parsing, brand detection & sample presets
│
├── assets/                        # Icons, splash screen, and static graphics
└── android/                       # Generated Android native project files
```

---

## 🏁 Getting Started

### Prerequisites

Ensure you have the following installed on your machine:
- **Node.js** (v18.x or v20.x recommended)
- **npm** or **yarn**
- **Android Studio** & **Android SDK** (API Level 34/35) if testing natively or on an emulator
- **Expo Go** app on your physical device, or a configured Android Emulator

### 1. Clone & Install Dependencies

```bash
git clone https://github.com/manish2297/ExpenseFinTech.git
cd ExpenseFinTech
npm install
```

### 2. Run with Expo CLI

Start the Expo development server:

```bash
npm start
# or
npx expo start
```

### 3. Run on Android Native Build

To run the application directly on a connected Android device or emulator using native build tools:

```bash
npm run android
# or
npx expo run:android
```

---

## 📦 Building Standalone APK (EAS Build)

The project includes pre-configured profiles in `eas.json` for creating standalone Android APKs.

1. **Install EAS CLI**:
   ```bash
   npm install -g eas-cli
   ```

2. **Login to Expo**:
   ```bash
   eas login
   ```

3. **Build Preview APK**:
   ```bash
   eas build -p android --profile preview
   ```

---

## 📱 Permissions Used (Android)

Configured inside `app.json`:
- `READ_SMS` & `RECEIVE_SMS`: Enables expense automation from banking notifications.
- `READ_MEDIA_IMAGES` / Gallery Access: Profile avatar customization via `expo-image-picker`.
- Storage / Document Sharing: Exporting monthly ledger CSV files via `expo-sharing`.

---

## 🤝 Contributing

Contributions, issues, and feature requests are welcome!

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📄 License

This project is open source and available under the [MIT License](LICENSE).
