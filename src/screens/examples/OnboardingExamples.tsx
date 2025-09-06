import React from "react";
import { View, Text, Button } from "react-native";
import { setLanguages, setLevel, setTimeCommit, setReminders, setHowDidYouHear, createAccount, setPlan } from "../../onboarding/actions";

export function LanguagesScreen({ navigation }: any) {
  return (
    <View style={{ padding: 24 }}>
      <Text>My languages</Text>
      <Button title="English + Catalan" onPress={async () => {
        await setLanguages("English", "Catalan");
        navigation.navigate("Level");
      }} />
    </View>
  );
}

export function LevelScreen({ navigation }: any) {
  return (
    <View style={{ padding: 24 }}>
      <Text>Current level</Text>
      <Button title="Beginner" onPress={async () => {
        await setLevel("Beginner");
        navigation.navigate("TimeCommit");
      }} />
    </View>
  );
}

export function TimeCommitScreen({ navigation }: any) {
  return (
    <View style={{ padding: 24 }}>
      <Text>Time per day</Text>
      <Button title="5 min/day" onPress={async () => {
        await setTimeCommit("5 min/day");
        navigation.navigate("Reminders");
      }} />
    </View>
  );
}

export function RemindersScreen({ navigation }: any) {
  return (
    <View style={{ padding: 24 }}>
      <Text>Stay motivated</Text>
      <Button title="Yes, remind me" onPress={async () => {
        await setReminders(true);
        navigation.navigate("Acquisition");
      }} />
    </View>
  );
}

export function AcquisitionScreen({ navigation }: any) {
  return (
    <View style={{ padding: 24 }}>
      <Text>How did you find us?</Text>
      <Button title="App Store" onPress={async () => {
        await setHowDidYouHear("App Store");
        navigation.navigate("CreateAccount");
      }} />
    </View>
  );
}

export function CreateAccountScreen({ navigation }: any) {
  return (
    <View style={{ padding: 24 }}>
      <Text>Create account</Text>
      <Button title="Use demo creds" onPress={async () => {
        await createAccount("Daniel", "danord180@icloud.com", "example123");
        navigation.navigate("Plan");
      }} />
    </View>
  );
}

export function PlanScreen({ navigation }: any) {
  return (
    <View style={{ padding: 24 }}>
      <Text>Choose your plan</Text>
      <Button title="Lifetime" onPress={async () => {
        await setPlan("lifetime");
        navigation.navigate("Complete");
      }} />
    </View>
  );
}

export function CompleteScreen({ navigation }: any) {
  return (
    <View style={{ padding: 24 }}>
      <Text>All set! 🎉</Text>
      <Button title="Go to app" onPress={() => navigation.replace("Home")} />
    </View>
  );
}
