import React, { useState } from 'react';
import {
  View,
  TextInput,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInputProps,
  ViewStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  hint?: string;
  leftIcon?: keyof typeof Ionicons.glyphMap;
  rightIcon?: keyof typeof Ionicons.glyphMap;
  onRightIconPress?: () => void;
  containerStyle?: ViewStyle;
  isPassword?: boolean;
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  hint,
  leftIcon,
  rightIcon,
  onRightIconPress,
  containerStyle,
  isPassword = false,
  style,
  ...rest
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const [focused, setFocused] = useState(false);

  const resolvedRightIcon = isPassword
    ? showPassword
      ? 'eye-off-outline'
      : 'eye-outline'
    : rightIcon;

  const handleRightPress = () => {
    if (isPassword) {
      setShowPassword((v) => !v);
    } else {
      onRightIconPress?.();
    }
  };

  return (
    <View style={[styles.container, containerStyle]}>
      {label && <Text style={styles.label}>{label}</Text>}
      <View
        style={[
          styles.inputWrapper,
          focused && styles.inputFocused,
          !!error && styles.inputError,
        ]}
      >
        {leftIcon && (
          <Ionicons
            name={leftIcon}
            size={20}
            color={focused ? Colors.primary : Colors.purpleMid}
            style={styles.leftIcon}
          />
        )}
        <TextInput
          style={[styles.input, leftIcon && styles.inputWithLeft, resolvedRightIcon && styles.inputWithRight, style]}
          placeholderTextColor={Colors.textLight}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          secureTextEntry={isPassword && !showPassword}
          textAlign="right"
          {...rest}
        />
        {resolvedRightIcon && (
          <TouchableOpacity onPress={handleRightPress} style={styles.rightIcon}>
            <Ionicons
              name={resolvedRightIcon}
              size={20}
              color={focused ? Colors.primary : Colors.purpleMid}
            />
          </TouchableOpacity>
        )}
      </View>
      {error && <Text style={styles.errorText}>{error}</Text>}
      {hint && !error && <Text style={styles.hint}>{hint}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { marginBottom: 16 },
  label: {
    fontFamily: 'Cairo_600SemiBold',
    fontSize: 14,
    color: Colors.purpleDark,
    marginBottom: 6,
    textAlign: 'right',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.cardBg,
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: 12,
    minHeight: 52,
  },
  inputFocused: {
    borderColor: Colors.primary,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 2,
  },
  inputError: { borderColor: Colors.error },
  input: {
    flex: 1,
    fontFamily: 'Cairo_400Regular',
    fontSize: 15,
    color: Colors.textPrimary,
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  inputWithLeft: { paddingRight: 14, paddingLeft: 8 },
  inputWithRight: { paddingLeft: 14, paddingRight: 8 },
  leftIcon: { marginRight: 4, paddingLeft: 14 },
  rightIcon: { paddingRight: 14 },
  errorText: {
    fontFamily: 'Cairo_400Regular',
    fontSize: 12,
    color: Colors.error,
    marginTop: 4,
    textAlign: 'right',
  },
  hint: {
    fontFamily: 'Cairo_400Regular',
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 4,
    textAlign: 'right',
  },
});
