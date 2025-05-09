
import '../../global.css'
import AppNavigator from "../navigation/AppNavigator";


import { NavigationIndependentTree } from '@react-navigation/native';

export default function RootLayout() {
  return (
    <NavigationIndependentTree>
      <AppNavigator />
    </NavigationIndependentTree>
  );
}
