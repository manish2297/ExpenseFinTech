import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Image, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import { UserStore } from '../store';

export default function EditProfileScreen({ navigation }) {
  const [firstName, setFirstName] = useState(UserStore.profile.firstName || '');
  const [lastName, setLastName] = useState(UserStore.profile.lastName || '');
  const [dob, setDob] = useState(UserStore.profile.dob ? new Date(UserStore.profile.dob) : new Date(1995, 0, 1));
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [avatar, setAvatar] = useState(UserStore.profile.avatar || 'https://randomuser.me/api/portraits/men/32.jpg');

  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsEditing: true, aspect: [1, 1], quality: 0.5 });
    if (!result.canceled) setAvatar(result.assets[0].uri);
  };

  const handleSave = () => {
    if (!firstName.trim() || !lastName.trim()) return Alert.alert("Error", "Please enter both First and Last name.");
    UserStore.update({ firstName: firstName.trim(), lastName: lastName.trim(), dob: dob.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }), avatar });
    navigation.goBack();
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}><Ionicons name="close" size={24} color="#333" /></TouchableOpacity>
        <Text style={styles.headerTitle}>Edit Profile</Text>
        <View style={{ width: 40 }} />
      </View>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <TouchableOpacity style={styles.previewContainer} onPress={pickImage}>
          <Image source={{ uri: avatar || 'https://randomuser.me/api/portraits/men/32.jpg' }} style={styles.largeAvatar} />
          <View style={styles.editBadge}><Ionicons name="camera" size={16} color="#fff" /></View>
        </TouchableOpacity>
        <Text style={styles.instructionText}>Tap to change avatar</Text>
        <View style={styles.row}>
          <View style={{ flex: 1, marginRight: 10 }}><Text style={styles.label}>First Name</Text><TextInput style={styles.input} placeholder="First" value={firstName} onChangeText={setFirstName} autoCorrect={false} /></View>
          <View style={{ flex: 1, marginLeft: 10 }}><Text style={styles.label}>Last Name</Text><TextInput style={styles.input} placeholder="Last" value={lastName} onChangeText={setLastName} autoCorrect={false} /></View>
        </View>
        <Text style={styles.label}>Date of Birth</Text>
        <TouchableOpacity style={styles.datePickerBtn} onPress={() => setShowDatePicker(true)}><Text style={styles.dateText}>{dob.toDateString()}</Text><Ionicons name="calendar-outline" size={20} color="#888" /></TouchableOpacity>
        {showDatePicker && <DateTimePicker value={dob} mode="date" display="default" maximumDate={new Date()} onChange={(e, d) => { setShowDatePicker(false); if(d) setDob(d); }} />}
        <TouchableOpacity style={styles.saveBtn} onPress={handleSave}><Text style={styles.saveBtnText}>Save Changes</Text></TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20 },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#333' }, backBtn: { width: 40, height: 40, borderRadius: 12, backgroundColor: '#F5F6F8', justifyContent: 'center', alignItems: 'center' },
  content: { padding: 20, paddingBottom: 50 },
  previewContainer: { alignSelf: 'center', marginBottom: 10, position: 'relative' }, largeAvatar: { width: 120, height: 120, borderRadius: 60, backgroundColor: '#F5F6F8' },
  editBadge: { position: 'absolute', bottom: 0, right: 0, backgroundColor: '#05A46D', width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center', borderWidth: 3, borderColor: '#fff', elevation: 2 },
  instructionText: { textAlign: 'center', fontSize: 13, color: '#888', marginBottom: 30 },
  row: { flexDirection: 'row', justifyContent: 'space-between' }, label: { fontSize: 14, fontWeight: '700', color: '#333', marginBottom: 10, marginLeft: 5 },
  input: { backgroundColor: '#F5F6F8', borderRadius: 16, padding: 16, fontSize: 15, color: '#333', marginBottom: 25 },
  datePickerBtn: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#F5F6F8', borderRadius: 16, padding: 18, marginBottom: 40 }, dateText: { fontSize: 15, color: '#333' },
  saveBtn: { backgroundColor: '#05A46D', padding: 18, borderRadius: 16, alignItems: 'center', elevation: 2 }, saveBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' }
});