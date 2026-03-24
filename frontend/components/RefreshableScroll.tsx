import React from "react";
import { RefreshControl, ScrollView, ScrollViewProps } from "react-native";

type Props = ScrollViewProps & {
  refreshing: boolean;
  onRefresh: () => void | Promise<void>;
};

export default function RefreshableScroll({
  refreshing,
  onRefresh,
  children,
  ...rest
}: Props) {
  return (
    <ScrollView
      {...rest}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
      keyboardShouldPersistTaps="handled"
    >
      {children}
    </ScrollView>
  );
}