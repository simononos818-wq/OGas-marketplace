import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, Text, StyleSheet } from 'react-native';

import HomeScreen from './screens/HomeScreen';
import BuyScreen from './screens/BuyScreen';
import OrdersScreen from './screens/OrdersScreen';
import ProfileScreen from './screens/ProfileScreen';

const Tab = createBottomTabNavigator();

function TabIcon({ name, focused }: { name: string; focused: boolean }) {
  const icons: any = {
    Home: '🔥',
    Buy: '🛒',
    Orders: '📦',
    Profile: '👤',
  };
  return (
    <View style={styles.iconContainer}>
      <Text style={styles.iconEmoji}>{icons[name]}</Text>
      <Text style={[styles.iconLabel, focused && styles.iconLabelActive]}>
        {name}
      </Text>
    </View>
  );
}

export default function App() {
  return (
    <NavigationContainer>
      <Tab.Navigator
        screenOptions={({ route }) => ({
          tabBarIcon: ({ focused }) => <TabIcon name={route.name} focused={focused} />,
          tabBarStyle: styles.tabBar,
          tabBarShowLabel: false,
          headerStyle: styles.header,
          headerTintColor: '#fff',
          headerTitleStyle: styles.headerTitle,
        })}
      >
        <Tab.Screen name="Home" component={HomeScreen} options={{ title: 'OGas 🔥' }} />
        <Tab.Screen name="Buy" component={BuyScreen} options={{ title: 'Order Gas' }} />
        <Tab.Screen name="Orders" component={OrdersScreen} options={{ title: 'My Orders' }} />
        <Tab.Screen name="Profile" component={ProfileScreen} options={{ title: 'Profile' }} />
      </Tab.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: '#0a0a0a',
    borderTopColor: '#222',
    borderTopWidth: 1,
    paddingBottom: 8,
    paddingTop: 8,
    height: 70,
  },
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconEmoji: {
    fontSize: 20,
  },
  iconLabel: {
    fontSize: 10,
    color: '#6b7280',
    marginTop: 2,
    fontWeight: '500',
  },
  iconLabelActive: {
    color: '#f97316',
    fontWeight: 'bold',
  },
  header: {
    backgroundColor: '#000',
    borderBottomColor: '#222',
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontWeight: 'bold',
    fontSize: 16,
  },
});
