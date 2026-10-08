import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Modal,
  ActivityIndicator,
  Alert,
  Dimensions,
  Animated,
  Easing,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import { WalletStore, UserStore } from '../store';
import {
  detectCardBrand,
  formatCardNumber,
  formatExpiry,
  performCardOcr,
  SAMPLE_CARDS,
} from '../utils/cardScanner';

const screenWidth = Dimensions.get('window').width;

const CARD_COLORS = [
  '#1C1C1E', // Obsidian
  '#05A46D', // Emerald Fintech
  '#007AFF', // Royal Blue
  '#AF52DE', // Deep Purple
  '#FF9500', // Sunset Orange
  '#FF2D55', // Crimson
];

export default function AddCardScreen({ navigation }) {
  const [cardNumber, setCardNumber] = useState('');
  const [holderName, setHolderName] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvv, setCvv] = useState('');
  const [balance, setBalance] = useState('25000');
  const [selectedColor, setSelectedColor] = useState(CARD_COLORS[0]);

  // Scanner modal & camera state
  const [scannerVisible, setScannerVisible] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [torchOn, setTorchOn] = useState(false);
  const [cameraFacing, setCameraFacing] = useState('back');

  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef(null);

  // Scanner laser line animation
  const laserAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (scannerVisible) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(laserAnim, {
            toValue: 1,
            duration: 1800,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(laserAnim, {
            toValue: 0,
            duration: 1800,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      laserAnim.stopAnimation();
    }
  }, [scannerVisible]);

  // Load user name default if available
  useEffect(() => {
    if (UserStore.profile && UserStore.profile.firstName) {
      const full = `${UserStore.profile.firstName} ${UserStore.profile.lastName || ''}`.trim().toUpperCase();
      if (!holderName) {
        setHolderName(full);
      }
    }
  }, []);

  const cardBrand = detectCardBrand(cardNumber);

  const handleCardNumberChange = (text) => {
    setCardNumber(formatCardNumber(text));
  };

  const handleExpiryChange = (text) => {
    setExpiry(formatExpiry(text));
  };

  // Open Scanner
  const openScanner = async () => {
    if (!permission?.granted) {
      const res = await requestPermission();
      if (!res.granted) {
        Alert.alert(
          'Camera Permission Required',
          'Please allow camera permission to scan cards directly, or pick an image from your photo gallery.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Choose from Gallery', onPress: pickImageFromGallery },
          ]
        );
        return;
      }
    }
    setScannerVisible(true);
  };

  // Capture & Run OCR
  const captureAndScan = async () => {
    if (!cameraRef.current || isProcessing) return;
    try {
      setIsProcessing(true);
      const photo = await cameraRef.current.takePictureAsync({
        base64: true,
        quality: 0.7,
      });

      if (photo?.base64) {
        const details = await performCardOcr(photo.base64);
        applyExtractedDetails(details);
      } else {
        Alert.alert('Scan Failed', 'Could not capture image frame. Please try again.');
      }
    } catch (err) {
      console.warn('Capture error:', err);
      Alert.alert('Scan Error', 'Unable to capture image. You can try choosing a photo from gallery.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Pick Image from Gallery
  const pickImageFromGallery = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        base64: true,
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets[0]?.base64) {
        setScannerVisible(false);
        setIsProcessing(true);
        const details = await performCardOcr(result.assets[0].base64);
        applyExtractedDetails(details);
      }
    } catch (err) {
      console.warn('Gallery pick error:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  // Quick Demo / Sample Card selection (great for emulator or quick testing)
  const useSampleCard = (sample) => {
    setCardNumber(sample.cardNumber);
    setHolderName(sample.holderName);
    setExpiry(sample.expiry);
    setSelectedColor(sample.color);
    setBalance(String(sample.balance));
    setScannerVisible(false);
    Alert.alert('Card Loaded', `${sample.name} loaded successfully!`);
  };

  const applyExtractedDetails = (details) => {
    setScannerVisible(false);
    if (!details || (!details.cardNumber && !details.holderName && !details.expiry)) {
      Alert.alert(
        'Card Unclear',
        'Could not automatically detect all card details from the image. You can type them in or try a clearer photo.'
      );
      return;
    }

    if (details.cardNumber) setCardNumber(details.cardNumber);
    if (details.holderName) setHolderName(details.holderName);
    if (details.expiry) setExpiry(details.expiry);

    Alert.alert(
      'Card Scanned!',
      `Detected: ${details.brand || 'Card'}\nPlease verify the details before saving.`
    );
  };

  // Save Card to WalletStore
  const handleSaveCard = async () => {
    const rawNum = cardNumber.replace(/\D/g, '');
    if (rawNum.length < 12) {
      return Alert.alert('Invalid Card Number', 'Please enter a valid card number (at least 12 digits).');
    }
    if (!holderName.trim()) {
      return Alert.alert('Missing Name', 'Please enter the cardholder name.');
    }

    const cleanBalance = parseFloat(balance.replace(/[^\d.-]/g, '')) || 0;
    const last4 = rawNum.slice(-4);

    const newCard = {
      id: Date.now().toString(),
      name: holderName.trim(),
      type: cardBrand === 'CARD' ? 'DEBIT' : cardBrand,
      balance: cleanBalance,
      color: selectedColor,
      number: `**** **** **** ${last4}`,
      fullNumber: cardNumber,
      expiry: expiry || '12/28',
    };

    await WalletStore.add(newCard);
    Alert.alert('Success', 'Card added to your wallet successfully!', [
      { text: 'OK', onPress: () => navigation.goBack() },
    ]);
  };

  // Format display for card preview
  const displayCardNumber = cardNumber.padEnd(19, '•');

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#1C1C1E" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Add Card</Text>
        <TouchableOpacity style={styles.scanHeaderBtn} onPress={openScanner}>
          <Ionicons name="scan-outline" size={22} color="#05A46D" />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Interactive Virtual Card Preview */}
        <View style={[styles.cardPreview, { backgroundColor: selectedColor }]}>
          <View style={styles.cardPreviewHeader}>
            <View style={styles.chipGraphic}>
              <View style={styles.chipLine1} />
              <View style={styles.chipLine2} />
            </View>
            <View style={styles.cardHeaderRight}>
              <MaterialCommunityIcons name="contactless-payment" size={26} color="rgba(255,255,255,0.7)" />
              <Text style={styles.cardBrandBadge}>{cardBrand}</Text>
            </View>
          </View>

          <Text style={styles.cardPreviewNumber}>
            {cardNumber ? cardNumber : '•••• •••• •••• ••••'}
          </Text>

          <View style={styles.cardPreviewFooter}>
            <View style={{ flex: 1 }}>
              <Text style={styles.cardPreviewLabel}>CARDHOLDER</Text>
              <Text style={styles.cardPreviewValue} numberOfLines={1}>
                {holderName ? holderName.toUpperCase() : 'YOUR NAME'}
              </Text>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={styles.cardPreviewLabel}>EXPIRES</Text>
              <Text style={styles.cardPreviewValue}>
                {expiry ? expiry : 'MM/YY'}
              </Text>
            </View>
          </View>
        </View>

        {/* Action Choice Banner: Scan vs Manual */}
        <View style={styles.actionBanner}>
          <TouchableOpacity style={styles.scanActionBtn} activeOpacity={0.8} onPress={openScanner}>
            <View style={styles.scanIconBg}>
              <Ionicons name="camera" size={22} color="#FFFFFF" />
            </View>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={styles.scanBtnTitle}>Scan Card with Camera</Text>
              <Text style={styles.scanBtnSubtitle}>Auto-extracts number, name & expiry date</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#05A46D" />
          </TouchableOpacity>
        </View>

        {/* Quick Demo Sample Cards */}
        <View style={styles.demoSection}>
          <Text style={styles.demoSectionTitle}>Or Quick-Fill with Sample:</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 8 }}>
            {SAMPLE_CARDS.map((card, idx) => (
              <TouchableOpacity
                key={idx}
                style={styles.demoChip}
                onPress={() => useSampleCard(card)}
              >
                <Ionicons name="flash" size={14} color="#05A46D" style={{ marginRight: 4 }} />
                <Text style={styles.demoChipText}>{card.name}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Manual Card Form Fields */}
        <View style={styles.formContainer}>
          <Text style={styles.formSectionHeader}>Card Details</Text>

          {/* Card Number Input */}
          <Text style={styles.inputLabel}>Card Number</Text>
          <View style={styles.inputWrapper}>
            <Ionicons name="card-outline" size={20} color="#666" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="4532 0000 0000 0000"
              placeholderTextColor="#999"
              value={cardNumber}
              onChangeText={handleCardNumberChange}
              keyboardType="number-pad"
              maxLength={19}
            />
            {cardNumber.length > 0 && (
              <TouchableOpacity onPress={() => setCardNumber('')}>
                <Ionicons name="close-circle" size={18} color="#999" />
              </TouchableOpacity>
            )}
          </View>

          {/* Cardholder Name Input */}
          <Text style={styles.inputLabel}>Cardholder Name</Text>
          <View style={styles.inputWrapper}>
            <Ionicons name="person-outline" size={20} color="#666" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="e.g. JOHN DOE"
              placeholderTextColor="#999"
              value={holderName}
              onChangeText={setHolderName}
              autoCapitalize="characters"
              autoCorrect={false}
            />
          </View>

          {/* Expiry & CVV Row */}
          <View style={styles.row}>
            <View style={{ flex: 1, marginRight: 10 }}>
              <Text style={styles.inputLabel}>Expiry (MM/YY)</Text>
              <View style={styles.inputWrapper}>
                <Ionicons name="calendar-outline" size={20} color="#666" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="MM/YY"
                  placeholderTextColor="#999"
                  value={expiry}
                  onChangeText={handleExpiryChange}
                  keyboardType="number-pad"
                  maxLength={5}
                />
              </View>
            </View>

            <View style={{ flex: 1, marginLeft: 10 }}>
              <Text style={styles.inputLabel}>CVV / CVC</Text>
              <View style={styles.inputWrapper}>
                <Ionicons name="lock-closed-outline" size={20} color="#666" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="123"
                  placeholderTextColor="#999"
                  value={cvv}
                  onChangeText={setCvv}
                  keyboardType="number-pad"
                  maxLength={4}
                  secureTextEntry
                />
              </View>
            </View>
          </View>

          {/* Initial Balance / Credit Limit */}
          <Text style={styles.inputLabel}>Initial Balance (₹)</Text>
          <View style={styles.inputWrapper}>
            <Text style={styles.currencyPrefix}>₹</Text>
            <TextInput
              style={styles.input}
              placeholder="25,000"
              placeholderTextColor="#999"
              value={balance}
              onChangeText={setBalance}
              keyboardType="numeric"
            />
          </View>

          {/* Card Theme Color Selector */}
          <Text style={styles.inputLabel}>Card Color Theme</Text>
          <View style={styles.colorPalette}>
            {CARD_COLORS.map((color, index) => {
              const isSelected = selectedColor === color;
              return (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.colorCircle,
                    { backgroundColor: color },
                    isSelected && styles.colorCircleSelected,
                  ]}
                  onPress={() => setSelectedColor(color)}
                >
                  {isSelected && <Ionicons name="checkmark" size={16} color="#FFFFFF" />}
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Save Card Button */}
          <TouchableOpacity style={styles.saveBtn} activeOpacity={0.8} onPress={handleSaveCard}>
            <Ionicons name="shield-checkmark-outline" size={20} color="#FFF" style={{ marginRight: 8 }} />
            <Text style={styles.saveBtnText}>Save Card to Wallet</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* FULLSCREEN CAMERA CARD SCANNER MODAL */}
      <Modal
        visible={scannerVisible}
        animationType="slide"
        transparent={false}
        onRequestClose={() => setScannerVisible(false)}
      >
        <SafeAreaView style={styles.scannerContainer}>
          {/* Scanner Header */}
          <View style={styles.scannerHeader}>
            <TouchableOpacity
              style={styles.scannerCloseBtn}
              onPress={() => setScannerVisible(false)}
            >
              <Ionicons name="close" size={28} color="#FFFFFF" />
            </TouchableOpacity>
            <Text style={styles.scannerHeaderTitle}>Scan Card</Text>
            <TouchableOpacity
              style={styles.scannerHeaderBtn}
              onPress={() => setTorchOn(!torchOn)}
            >
              <Ionicons
                name={torchOn ? 'flash' : 'flash-off'}
                size={22}
                color={torchOn ? '#FFD700' : '#FFFFFF'}
              />
            </TouchableOpacity>
          </View>

          {/* Camera Viewfinder with Card Cutout */}
          <View style={styles.cameraFrame}>
            <CameraView
              ref={cameraRef}
              style={StyleSheet.absoluteFillObject}
              facing={cameraFacing}
              enableTorch={torchOn}
            >
              {/* Dark Overlays around the card window */}
              <View style={styles.overlayTop} />
              <View style={styles.overlayCenterRow}>
                <View style={styles.overlaySide} />

                {/* Target Card Window */}
                <View style={styles.targetWindow}>
                  {/* Corner Target Markers */}
                  <View style={[styles.cornerMarker, styles.cornerTL]} />
                  <View style={[styles.cornerMarker, styles.cornerTR]} />
                  <View style={[styles.cornerMarker, styles.cornerBL]} />
                  <View style={[styles.cornerMarker, styles.cornerBR]} />

                  {/* Animated Laser Scanning Beam */}
                  <Animated.View
                    style={[
                      styles.laserLine,
                      {
                        transform: [
                          {
                            translateY: laserAnim.interpolate({
                              inputRange: [0, 1],
                              outputRange: [0, 200],
                            }),
                          },
                        ],
                      },
                    ]}
                  />

                  {/* Target guide prompt */}
                  <View style={styles.windowPrompt}>
                    <Text style={styles.windowPromptText}>Fit card inside the frame</Text>
                  </View>
                </View>

                <View style={styles.overlaySide} />
              </View>
              <View style={styles.overlayBottom} />
            </CameraView>
          </View>

          {/* Processing Indicator */}
          {isProcessing && (
            <View style={styles.processingOverlay}>
              <View style={styles.processingCard}>
                <ActivityIndicator size="large" color="#05A46D" />
                <Text style={styles.processingTitle}>Scanning Card Details...</Text>
                <Text style={styles.processingSubtitle}>Extracting numbers, name & expiry with AI</Text>
              </View>
            </View>
          )}

          {/* Scanner Bottom Controls */}
          <View style={styles.scannerControls}>
            <TouchableOpacity
              style={styles.scannerSecondaryBtn}
              onPress={pickImageFromGallery}
            >
              <Ionicons name="images-outline" size={24} color="#FFFFFF" />
              <Text style={styles.scannerControlLabel}>Gallery</Text>
            </TouchableOpacity>

            {/* Shutter Capture Button */}
            <TouchableOpacity
              style={styles.shutterBtn}
              activeOpacity={0.8}
              onPress={captureAndScan}
              disabled={isProcessing}
            >
              <View style={styles.shutterBtnInner} />
            </TouchableOpacity>

            {/* Quick Demo Fallback */}
            <TouchableOpacity
              style={styles.scannerSecondaryBtn}
              onPress={() => useSampleCard(SAMPLE_CARDS[0])}
            >
              <Ionicons name="flash-outline" size={24} color="#05A46D" />
              <Text style={[styles.scannerControlLabel, { color: '#05A46D' }]}>Demo Card</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Modal>
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
  scanHeaderBtn: {
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

  /* Card Preview */
  cardPreview: {
    width: '100%',
    height: 200,
    borderRadius: 18,
    padding: 22,
    justifyContent: 'space-between',
    elevation: 6,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 10,
    marginBottom: 20,
  },
  cardPreviewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  chipGraphic: {
    width: 38,
    height: 28,
    backgroundColor: '#E0AA3E',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#C59128',
    padding: 3,
    justifyContent: 'space-around',
  },
  chipLine1: {
    height: 1,
    backgroundColor: 'rgba(0,0,0,0.2)',
  },
  chipLine2: {
    height: 1,
    backgroundColor: 'rgba(0,0,0,0.2)',
  },
  cardHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  cardBrandBadge: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 1,
  },
  cardPreviewNumber: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: 3,
    textAlign: 'center',
  },
  cardPreviewFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  cardPreviewLabel: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.8,
    marginBottom: 2,
  },
  cardPreviewValue: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.5,
  },

  /* Scan Banner */
  actionBanner: {
    marginBottom: 16,
  },
  scanActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1.5,
    borderColor: '#05A46D',
    elevation: 3,
    shadowColor: '#05A46D',
    shadowOpacity: 0.12,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 6,
  },
  scanIconBg: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#05A46D',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scanBtnTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1C1C1E',
  },
  scanBtnSubtitle: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },

  /* Demo Chips */
  demoSection: {
    marginBottom: 20,
  },
  demoSectionTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#888',
    marginLeft: 4,
  },
  demoChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 7,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  demoChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#333',
  },

  /* Form Container */
  formContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
  },
  formSectionHeader: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1C1C1E',
    marginBottom: 16,
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
  row: {
    flexDirection: 'row',
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

  /* Scanner Modal Styles */
  scannerContainer: {
    flex: 1,
    backgroundColor: '#000000',
  },
  scannerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    zIndex: 10,
  },
  scannerCloseBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scannerHeaderTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },
  scannerHeaderBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cameraFrame: {
    flex: 1,
    position: 'relative',
  },

  /* Cutout Overlay */
  overlayTop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.65)',
  },
  overlayCenterRow: {
    flexDirection: 'row',
    height: 220,
  },
  overlaySide: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.65)',
  },
  targetWindow: {
    width: screenWidth * 0.86,
    height: 220,
    borderRadius: 16,
    position: 'relative',
    overflow: 'hidden',
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  overlayBottom: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.65)',
  },

  /* Corner Markers */
  cornerMarker: {
    position: 'absolute',
    width: 24,
    height: 24,
    borderColor: '#05A46D',
  },
  cornerTL: {
    top: 0,
    left: 0,
    borderTopWidth: 4,
    borderLeftWidth: 4,
    borderTopLeftRadius: 14,
  },
  cornerTR: {
    top: 0,
    right: 0,
    borderTopWidth: 4,
    borderRightWidth: 4,
    borderTopRightRadius: 14,
  },
  cornerBL: {
    bottom: 0,
    left: 0,
    borderBottomWidth: 4,
    borderLeftWidth: 4,
    borderBottomLeftRadius: 14,
  },
  cornerBR: {
    bottom: 0,
    right: 0,
    borderBottomWidth: 4,
    borderRightWidth: 4,
    borderBottomRightRadius: 14,
  },

  /* Laser Beam */
  laserLine: {
    width: '100%',
    height: 3,
    backgroundColor: '#05A46D',
    shadowColor: '#05A46D',
    shadowOpacity: 1,
    shadowOffset: { width: 0, height: 0 },
    shadowRadius: 10,
    elevation: 5,
  },
  windowPrompt: {
    position: 'absolute',
    bottom: 12,
    alignSelf: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 12,
  },
  windowPromptText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },

  /* Processing Overlay */
  processingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.75)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 99,
  },
  processingCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    width: '80%',
    elevation: 8,
  },
  processingTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1C1C1E',
    marginTop: 14,
  },
  processingSubtitle: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    marginTop: 6,
  },

  /* Bottom Controls */
  scannerControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingVertical: 25,
    paddingHorizontal: 30,
    backgroundColor: '#000000',
  },
  scannerSecondaryBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 70,
  },
  scannerControlLabel: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '600',
    marginTop: 6,
  },
  shutterBtn: {
    width: 76,
    height: 76,
    borderRadius: 38,
    borderWidth: 4,
    borderColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  shutterBtnInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#05A46D',
  },
});
