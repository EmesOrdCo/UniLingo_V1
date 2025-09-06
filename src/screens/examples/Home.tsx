import React, { useEffect, useState } from "react";
import { View, Text } from "react-native";
import { getMyUser } from "../../lib/users";

export default function Home() {
  const [name, setName] = useState<string>("");

  useEffect(() => {
    (async () => {
      const me = await getMyUser();
      setName(me?.name ?? "");
    })();
  }, []);

  return (
    <View style={{ padding: 24 }}>
      <Text>Welcome {name ? name : "back"} 👋</Text>
    </View>
  );
}
