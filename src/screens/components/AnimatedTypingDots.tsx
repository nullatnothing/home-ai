import React, { useEffect, useState } from "react";
import { Animated, View } from "react-native";
import { styles } from "../../theme/styles";

type AnimatedTypingDotsProps = { compact?: boolean };

export function AnimatedTypingDots({ compact = false }: AnimatedTypingDotsProps) {
  const [dotAnimations] = useState(() =>
    [0, 1, 2].map(() => new Animated.Value(0)),
  );

  useEffect(() => {
    const animations = dotAnimations.map((dot, index) =>
      Animated.sequence([
        Animated.delay(index * 120),
        Animated.timing(dot, { toValue: 1, duration: 220, useNativeDriver: true }),
        Animated.timing(dot, { toValue: 0.35, duration: 220, useNativeDriver: true }),
        Animated.timing(dot, { toValue: 1, duration: 220, useNativeDriver: true }),
      ]),
    );
    const animation = Animated.loop(Animated.parallel(animations));
    animation.start();
    return () => animation.stop();
  }, [dotAnimations]);

  return (
    <View style={[styles.typingRow, compact && styles.typingRowCompact]}>
      {dotAnimations.map((dot, index) => (
        <Animated.View
          key={index}
          style={[
            styles.typingDot,
            compact && styles.typingDotCompact,
            { transform: [{ scale: dot }] },
          ]}
        />
      ))}
    </View>
  );
}

