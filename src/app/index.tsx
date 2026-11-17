import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { appendDecimal, appendDigit, evaluateExpression, formatNumber } from '@/utils/calculatorLogic';

const rows = [
  ['AC', '+/−', '%', '÷'],
  ['7', '8', '9', '×'],
  ['4', '5', '6', '-'],
  ['1', '2', '3', '+'],
  ['00', '0', '.', '='],
];

function getCurrentEntry(expression: string) {
  return expression.match(/-?\d*\.?\d*$/)?.[0] || '0';
}

export default function HomeScreen() {
  const { width, height } = useWindowDimensions();
  const [expression, setExpression] = useState('0');
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [justCalculated, setJustCalculated] = useState(false);
  const compact = height < 700;
  const currentEntry = getCurrentEntry(expression);

  const preview = useMemo(() => {
    if (result !== null || !/[+×÷-]/.test(expression.slice(1))) return null;
    try {
      return formatNumber(evaluateExpression(expression));
    } catch {
      return null;
    }
  }, [expression, result]);

  function press(label: string) {
    setError(null);
    if (label === 'AC') {
      setExpression('0');
      setResult(null);
      setJustCalculated(false);
      return;
    }
    if (label === '⌫') {
      setResult(null);
      setJustCalculated(false);
      setExpression((value) => {
        const base = justCalculated && result !== null ? result : value;
        return base.length <= 1 ? '0' : base.slice(0, -1);
      });
      return;
    }
    if (label === '+/−') {
      setResult(null);
      setJustCalculated(false);
      setExpression((value) => {
        const base = justCalculated && result !== null ? result : value;
        const match = base.match(/-?\d*\.?\d*$/);
        const entry = match?.[0] ?? '';
        const start = base.length - entry.length;
        const toggled = entry.startsWith('-') ? entry.slice(1) : `-${entry || '0'}`;
        return `${base.slice(0, start)}${toggled}`;
      });
      return;
    }
    if (/^\d+$/.test(label)) {
      setExpression((value) => {
        const base = justCalculated ? '0' : value;
        return appendDigit(base, label);
      });
      setResult(null);
      setJustCalculated(false);
      return;
    }
    if (label === '.') {
      setExpression((value) => appendDecimal(justCalculated ? '0' : value));
      setResult(null);
      setJustCalculated(false);
      return;
    }
    if (label === '%') {
      setExpression((value) => {
        const base = justCalculated && result !== null ? result : value;
        return base.endsWith('%') ? base : `${base}%`;
      });
      setResult(null);
      setJustCalculated(false);
      return;
    }
    if (label === '=') {
      try {
        const nextResult = formatNumber(evaluateExpression(expression));
        setResult(nextResult);
        setJustCalculated(true);
      } catch (reason) {
        setError(reason instanceof Error ? reason.message : 'Invalid calculation');
        setResult(null);
      }
      return;
    }
    if (['+', '-', '×', '÷'].includes(label)) {
      setExpression((value) => {
        const base = justCalculated && result !== null ? result : value;
        if (['+', '-', '×', '÷'].includes(base.slice(-1))) return `${base.slice(0, -1)}${label}`;
        return `${base}${label}`;
      });
      setResult(null);
      setJustCalculated(false);
    }
  }

  const buttonSize = Math.max(42, Math.min((Math.min(width, 520) - 48 - 36) / 4, (height - (compact ? 245 : 290)) / 5));
  const displayValue = result ?? currentEntry;
  const fontSize = Math.max(42, Math.min(76, buttonSize * 0.85, 440 / Math.max(displayValue.length, 1)));

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={[styles.display, compact && styles.compactDisplay]}>
          <View style={styles.displayHeader}>
            <Pressable accessibilityRole="button" accessibilityLabel="Backspace" onPress={() => press('⌫')} hitSlop={12} style={({ pressed }) => [styles.backspace, pressed && styles.pressed]}>
              <Text style={styles.backspaceText}>⌫</Text>
            </Pressable>
          </View>
          <Text numberOfLines={1} adjustsFontSizeToFit style={styles.expression}>{result !== null ? `${expression} =` : expression}</Text>
          <Text numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.45} style={[styles.value, { fontSize }]}>{displayValue}</Text>
          <Text style={styles.preview}>{error ?? (result !== null ? 'Result' : preview ? `= ${preview}` : ' ')}</Text>
        </View>

        <View style={styles.keypad}>
          {rows.map((row) => (
            <View key={row.join('')} style={styles.row}>
              {row.map((label) => {
                const utility = ['AC', '+/−', '%'].includes(label);
                const operator = ['÷', '×', '-', '+', '='].includes(label);
                const selected = ['+', '-', '×', '÷'].includes(label) && expression.endsWith(label);
                return (
                  <Pressable
                    key={label}
                    accessibilityRole="button"
                    accessibilityLabel={label === '+/−' ? 'Toggle sign' : label}
                    onPress={() => press(label)}
                    style={({ pressed }) => [
                      styles.key,
                      { height: buttonSize },
                      utility ? styles.utilityKey : operator ? styles.operatorKey : styles.numberKey,
                      selected && styles.selectedOperator,
                      pressed && styles.pressed,
                    ]}>
                    <Text style={[styles.keyLabel, utility && styles.utilityLabel, selected && styles.selectedOperatorLabel, label === 'AC' && styles.clearLabel]}>{label}</Text>
                  </Pressable>
                );
              })}
            </View>
          ))}
        </View>
        <View style={styles.homeIndicator}><View style={styles.indicator} /></View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#101114' },
  container: { flex: 1, width: '100%', maxWidth: 520, alignSelf: 'center', paddingHorizontal: 24 },
  display: { flex: 1, justifyContent: 'flex-end', paddingBottom: 24, minHeight: 180 },
  compactDisplay: { paddingBottom: 12, minHeight: 130 },
  displayHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 22 },
  backspace: { width: 42, height: 36, alignItems: 'center', justifyContent: 'center', borderRadius: 14, backgroundColor: '#1c1d22' },
  backspaceText: { color: '#c7c8cd', fontSize: 20 },
  expression: { color: '#858790', textAlign: 'right', fontSize: 19, minHeight: 28, marginBottom: 10 },
  value: { color: '#f7f7fa', textAlign: 'right', fontWeight: '300', letterSpacing: -2, includeFontPadding: false },
  preview: { color: '#f3a44c', textAlign: 'right', fontSize: 15, minHeight: 22, marginTop: 8 },
  keypad: { gap: 9, paddingTop: 10 },
  row: { flexDirection: 'row', gap: 9 },
  key: { flex: 1, borderRadius: 24, justifyContent: 'center', alignItems: 'center' },
  numberKey: { backgroundColor: '#24252b' },
  utilityKey: { backgroundColor: '#d9d9de' },
  operatorKey: { backgroundColor: '#f49a38' },
  selectedOperator: { backgroundColor: '#f3f3f5' },
  keyLabel: { color: '#f7f7f8', fontSize: 27, fontWeight: '500' },
  utilityLabel: { color: '#202127', fontSize: 21, fontWeight: '600' },
  clearLabel: { fontSize: 18 },
  selectedOperatorLabel: { color: '#ed8d2c' },
  pressed: { opacity: 0.62, transform: [{ scale: 0.96 }] },
  homeIndicator: { height: 20, alignItems: 'center', justifyContent: 'flex-end', paddingBottom: 3 },
  indicator: { height: 4, width: 108, borderRadius: 2, backgroundColor: '#77787d' },
});
