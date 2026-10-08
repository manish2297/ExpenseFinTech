import React, { useState, useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';

import LoginScreen from './screens/LoginScreen';
import SmsPermissionScreen from './screens/SmsPermissionScreen';
import HomeScreen from './screens/HomeScreen';
import TransactionsHistoryScreen from './screens/TransactionsHistoryScreen';
import AddExpenseScreen from './screens/AddExpenseScreen'; 
import EditProfileScreen from './screens/EditProfileScreen'; 
import StatsScreen from './screens/StatsScreen'; 
import TapToPayScreen from './screens/TapToPayScreen'; 
import AddCardScreen from './screens/AddCardScreen'; 

const Stack = createNativeStackNavigator();

export default function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [hasGrantedPermission, setHasGrantedPermission] = useState(false);

  useEffect(() => {
    async function checkAppState() {
      try {
        const smsFlag = await AsyncStorage.getItem('permission_sms');
        if (smsFlag === 'true') {
          setHasGrantedPermission(true);
        }
      } catch (e) {
        console.warn(e);
      }
      setIsLoading(false);
    }
    checkAppState();
  }, []);

  if (isLoading) return <View style={{ flex: 1, justifyContent: 'center' }}><ActivityIndicator size="large" color="#05A46D" /></View>;

  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          
          {!isAuthenticated ? (
            <Stack.Screen name="Login">
              {(props) => <LoginScreen {...props} onLogin={() => setIsAuthenticated(true)} />}
            </Stack.Screen>
          ) : 
          
          !hasGrantedPermission ? (
            <Stack.Screen name="SmsPermission">
              {(props) => <SmsPermissionScreen {...props} onGrant={() => setHasGrantedPermission(true)} />}
            </Stack.Screen>
          ) : 
          
          (
            <>
              <Stack.Screen name="Home" component={HomeScreen} />
              <Stack.Screen name="TransactionsHistory" component={TransactionsHistoryScreen} />
              <Stack.Screen name="AddExpense" component={AddExpenseScreen} />
              <Stack.Screen name="EditProfile" component={EditProfileScreen} />
              <Stack.Screen name="Stats" component={StatsScreen} />
              <Stack.Screen name="TapToPay" component={TapToPayScreen} /> 
              <Stack.Screen name="AddCard" component={AddCardScreen} />
            </>
          )}

        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}