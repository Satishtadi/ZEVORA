import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../lib/auth';
import { portalForRole } from '../lib/roles';
import { colors, spacing, typography } from '../theme';
import { LoginScreen } from '../screens/auth/LoginScreen';
import { RegisterScreen } from '../screens/auth/RegisterScreen';
import { HomeScreen } from '../screens/passenger/HomeScreen';
import { SearchScreen } from '../screens/passenger/SearchScreen';
import { CompareScreen } from '../screens/passenger/CompareScreen';
import { RideDetailsScreen } from '../screens/passenger/RideDetailsScreen';
import { BookingsScreen } from '../screens/passenger/BookingsScreen';
import { BookingDetailsScreen } from '../screens/passenger/BookingDetailsScreen';
import { SafetyScreen } from '../screens/passenger/SafetyScreen';
import { NotificationsScreen } from '../screens/passenger/NotificationsScreen';
import { ProfileScreen } from '../screens/passenger/ProfileScreen';
import { DriverHomeScreen } from '../screens/driver/DriverHomeScreen';
import { DriverRidesScreen } from '../screens/driver/DriverRidesScreen';
import { PublishRideScreen } from '../screens/driver/PublishRideScreen';
import { DriverRequestsScreen } from '../screens/driver/DriverRequestsScreen';
import { DriverVehiclesScreen } from '../screens/driver/DriverVehiclesScreen';
import { DriverProfileScreen } from '../screens/driver/DriverProfileScreen';
import { PortalUnsupportedScreen } from '../screens/PortalUnsupportedScreen';
import type {
  BookingsStackParamList,
  DriverRidesStackParamList,
  DriverTabParamList,
  PassengerTabParamList,
  RootStackParamList,
  SearchStackParamList,
} from './types';

const RootStack = createNativeStackNavigator<RootStackParamList>();
const PassengerTabs = createBottomTabNavigator<PassengerTabParamList>();
const DriverTabs = createBottomTabNavigator<DriverTabParamList>();
const SearchStack = createNativeStackNavigator<SearchStackParamList>();
const BookingsStack = createNativeStackNavigator<BookingsStackParamList>();
const DriverRidesStack = createNativeStackNavigator<DriverRidesStackParamList>();

const theme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: colors.background,
    card: colors.white,
    text: colors.ink,
    primary: colors.brand,
    border: colors.ink100,
  },
};

const tabScreenOptions = {
  headerShown: false,
  tabBarActiveTintColor: colors.brand,
  tabBarInactiveTintColor: colors.ink400,
  tabBarStyle: {
    backgroundColor: colors.white,
    borderTopColor: colors.ink100,
    paddingTop: 6,
  },
  tabBarLabelStyle: { fontSize: 10, fontWeight: '700' as const, marginBottom: 4 },
};

function SearchNavigator() {
  return (
    <SearchStack.Navigator screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.background } }}>
      <SearchStack.Screen name="Search" component={SearchScreen} />
      <SearchStack.Screen name="Compare" component={CompareScreen} />
    </SearchStack.Navigator>
  );
}

function BookingsNavigator() {
  return (
    <BookingsStack.Navigator screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.background } }}>
      <BookingsStack.Screen name="Bookings" component={BookingsScreen} />
    </BookingsStack.Navigator>
  );
}

function PassengerNavigator() {
  return (
    <PassengerTabs.Navigator screenOptions={tabScreenOptions}>
      <PassengerTabs.Screen
        name="Home"
        component={HomeScreen}
        options={{ tabBarIcon: ({ color, size }) => <Ionicons name="home-outline" size={size} color={color} /> }}
      />
      <PassengerTabs.Screen
        name="SearchTab"
        component={SearchNavigator}
        options={{
          title: 'Search',
          tabBarIcon: ({ color, size }) => <Ionicons name="search-outline" size={size} color={color} />,
        }}
      />
      <PassengerTabs.Screen
        name="BookingsTab"
        component={BookingsNavigator}
        options={{
          title: 'Bookings',
          tabBarIcon: ({ color, size }) => <Ionicons name="ticket-outline" size={size} color={color} />,
        }}
      />
      <PassengerTabs.Screen
        name="SafetyTab"
        component={SafetyScreen}
        options={{
          title: 'Safety',
          tabBarIcon: ({ color, size }) => <Ionicons name="shield-checkmark-outline" size={size} color={color} />,
        }}
      />
      <PassengerTabs.Screen
        name="ProfileTab"
        component={ProfileScreen}
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, size }) => <Ionicons name="person-outline" size={size} color={color} />,
        }}
      />
    </PassengerTabs.Navigator>
  );
}

function DriverRidesNavigator() {
  return (
    <DriverRidesStack.Navigator screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.background } }}>
      <DriverRidesStack.Screen name="MyRides" component={DriverRidesScreen} />
      <DriverRidesStack.Screen name="PublishRide" component={PublishRideScreen} />
    </DriverRidesStack.Navigator>
  );
}

function DriverNavigator() {
  return (
    <DriverTabs.Navigator screenOptions={tabScreenOptions}>
      <DriverTabs.Screen
        name="DriverHome"
        component={DriverHomeScreen}
        options={{
          title: 'Home',
          tabBarIcon: ({ color, size }) => <Ionicons name="speedometer-outline" size={size} color={color} />,
        }}
      />
      <DriverTabs.Screen
        name="DriverRides"
        component={DriverRidesNavigator}
        options={{
          title: 'Rides',
          tabBarIcon: ({ color, size }) => <Ionicons name="car-outline" size={size} color={color} />,
        }}
      />
      <DriverTabs.Screen
        name="DriverRequests"
        component={DriverRequestsScreen}
        options={{
          title: 'Requests',
          tabBarIcon: ({ color, size }) => <Ionicons name="people-outline" size={size} color={color} />,
        }}
      />
      <DriverTabs.Screen
        name="DriverVehicles"
        component={DriverVehiclesScreen}
        options={{
          title: 'Vehicles',
          tabBarIcon: ({ color, size }) => <Ionicons name="albums-outline" size={size} color={color} />,
        }}
      />
      <DriverTabs.Screen
        name="DriverProfile"
        component={DriverProfileScreen}
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, size }) => <Ionicons name="person-outline" size={size} color={color} />,
        }}
      />
    </DriverTabs.Navigator>
  );
}

export function RootNavigator() {
  const { user, isLoading } = useAuth();
  const portal = portalForRole(user?.role);

  if (isLoading) {
    return (
      <View style={styles.splash}>
        <View style={styles.logo}>
          <Text style={styles.logoText}>Z</Text>
        </View>
        <Text style={styles.brand}>ZEVORA</Text>
        <Text style={styles.tagline}>Move Smart. Travel Together.</Text>
        <ActivityIndicator color={colors.brand} style={{ marginTop: spacing.xl }} />
      </View>
    );
  }

  return (
    <NavigationContainer theme={theme} key={`${user?.id ?? 'guest'}-${portal}`}>
      <RootStack.Navigator screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.background } }}>
        {!user ? (
          <>
            <RootStack.Screen name="Login" component={LoginScreen} />
            <RootStack.Screen name="Register" component={RegisterScreen} />
          </>
        ) : portal === 'driver' ? (
          <>
            <RootStack.Screen name="DriverTabs" component={DriverNavigator} />
            <RootStack.Screen name="Notifications" component={NotificationsScreen} />
          </>
        ) : portal === 'passenger' ? (
          <>
            <RootStack.Screen name="PassengerTabs" component={PassengerNavigator} />
            <RootStack.Screen name="RideDetails" component={RideDetailsScreen} />
            <RootStack.Screen name="BookingDetails" component={BookingDetailsScreen} />
            <RootStack.Screen name="Notifications" component={NotificationsScreen} />
          </>
        ) : (
          <RootStack.Screen name="PortalUnsupported" component={PortalUnsupportedScreen} />
        )}
      </RootStack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  splash: { flex: 1, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center' },
  logo: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: colors.brand,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoText: { color: colors.white, fontSize: 31, fontWeight: '900' },
  brand: { marginTop: spacing.md, fontSize: 22, fontWeight: '900', letterSpacing: 3, color: colors.ink },
  tagline: { ...typography.caption, marginTop: 4 },
});
