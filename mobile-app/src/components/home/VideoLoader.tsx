import React from 'react';
import { View, Animated, Easing } from 'react-native';
import { styles } from './VideoCard.styles';

export const VideoLoader = () => {
  const time = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    Animated.loop(
      Animated.timing(time, {
        toValue: 4000,
        duration: 4000,
        useNativeDriver: false,
        easing: Easing.linear,
      })
    ).start();
  }, [time]);

  const getTLBR = (anim: any) => anim.interpolate({
    inputRange: [0, 200, 600, 800, 1200, 1400, 1800, 2000, 2200, 2600, 2800, 3200, 3400, 3800, 4000],
    outputRange: [0, 0, 17.5, 17.5, 17.5, 17.5, 0, 0, 0, 17.5, 17.5, 17.5, 17.5, 0, 0]
  });
  const getTRBL = (anim: any) => anim.interpolate({
    inputRange: [0, 200, 600, 800, 1200, 1400, 1800, 2000, 2200, 2600, 2800, 3200, 3400, 3800, 4000],
    outputRange: [0, 0, 0, 0, 17.5, 17.5, 17.5, 17.5, 17.5, 17.5, 17.5, 0, 0, 0, 0]
  });

  const p1_time = time;
  const p2_time = Animated.modulo(Animated.add(time, 1000), 4000);

  const renderSquare = (p_time: any, key: string) => {
    const tlbr = getTLBR(p_time);
    const trbl = getTRBL(p_time);
    return (
      <Animated.View
        key={key}
        style={[
          styles.loaderSquare,
          {
            borderTopLeftRadius: tlbr,
            borderBottomRightRadius: tlbr,
            borderTopRightRadius: trbl,
            borderBottomLeftRadius: trbl,
          }
        ]}
      />
    );
  };

  return (
    <View style={styles.loaderContainer}>
      <View style={styles.loaderGrid}>
        {renderSquare(p1_time, 'tl')}
        {renderSquare(p2_time, 'tr')}
        {renderSquare(p2_time, 'bl')}
        {renderSquare(p1_time, 'br')}
      </View>
    </View>
  );
};
