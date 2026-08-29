import { Tabs } from 'expo-router'
import TabBar from '../../src/components/TabBar'

export default function TabLayout() {
  return (
    <Tabs
      tabBar={(props) => <TabBar {...props} />}
      screenOptions={{
        headerShown: false,
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Главная' }} />
      <Tabs.Screen name="catalog" options={{ title: 'Каталог' }} />
      <Tabs.Screen name="genres" options={{ title: 'Жанры' }} />
      <Tabs.Screen name="schedule" options={{ title: 'Расписание' }} />
      <Tabs.Screen name="profile" options={{ title: 'Профиль' }} />
    </Tabs>
  )
}
