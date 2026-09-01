import { ActivityIndicator, View } from "react-native";
import { Redirect } from "expo-router";
import { useCurrentUser } from "@/hooks/useMobileData";
import { colors } from "@/theme";

export default function Index() {
  const { user, loading } = useCurrentUser();
  if (loading) return <View style={{ flex: 1, justifyContent: "center", backgroundColor: colors.background }}><ActivityIndicator color={colors.primary} /></View>;
  return <Redirect href={user ? "/(tabs)" : "/auth"} />;
}
