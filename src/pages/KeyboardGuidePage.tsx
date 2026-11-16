import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import {
  FINGER_META,
  findKeyByEvent,
  getTargetKeyGuide,
  type KeyDefinition,
} from '../core/keyboardLayout';
import { soundEngine } from '../core/soundEngine';
import { useAppStore } from '../store/useAppStore';
import { VirtualKeyboard } from '../components/VirtualKeyboard';
import { HandDiagram } from '../components/HandDiagram';

export const KeyboardGuidePage: React.FC = () => {
  const { preferences } = useAppStore();
  const [selectedKey, setSelectedKey] = useState<KeyDefinition | null>(null);
  const [pressedCodes, setPressedCodes] = useState<Set<string>>(() => new Set());
  const [sampleChar, setSampleChar] = useState<string>('f');

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      const keyDef = findKeyByEvent(e.code, e.key);
      if (keyDef) {
        if (e.key === ' ') e.preventDefault();
        setPressedCodes((prev) => new Set(prev).add(keyDef.id));
        setSelectedKey(keyDef);
        if (e.key.length === 1) setSampleChar(e.key);
        soundEngine.playKeyClick(preferences.soundEnabled, true);
      }
    };
    const onKeyUp = (e: KeyboardEvent) => {
      const keyDef = findKeyByEvent(e.code, e.key);
      if (keyDef) {
        setPressedCodes((prev) => {
          const next = new Set(prev);
          next.delete(keyDef.id);
          return next;
        });
      }
    };
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
    };
  }, [preferences.soundEnabled]);

  const guide = getTargetKeyGuide(sampleChar);
  const activeFinger = selectedKey?.finger ?? guide?.finger.id ?? 'left-index';
  const secondaryFinger = guide?.shiftFinger?.id ?? null;

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-[var(--text-primary)]">
            Interactive Finger Placement Guide
          </h1>
          <p className="text-sm text-[var(--text-secondary)] mt-1">
            Press any physical key or click any virtual key to inspect proper touch-typing finger posture.
          </p>
        </div>

        <Link
          to="/learn/home-row"
          className="inline-flex items-center gap-2 rounded-xl bg-[var(--accent-primary)] px-4 py-2.5 text-xs font-semibold text-white self-start"
        >
          <span>Practice Home Row</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      {/* Hand Visualization + Active Key Inspector */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-6">
        <div className="space-y-3">
          <p className="text-xs font-semibold text-[var(--accent-primary)]">
            Active Finger Assignment
          </p>
          <div className="text-2xl font-bold text-[var(--text-primary)]">
            {selectedKey ? `Key "${selectedKey.label}"` : `Sample Character "${sampleChar}"`}
          </div>
          <p className="text-sm text-[var(--text-secondary)]">
            Use{' '}
            <strong style={{ color: FINGER_META[activeFinger].colorHex }}>
              {FINGER_META[activeFinger].label}
            </strong>
            {secondaryFinger && (
              <>
                {' '}while holding Shift with{' '}
                <strong style={{ color: FINGER_META[secondaryFinger].colorHex }}>
                  {FINGER_META[secondaryFinger].label}
                </strong>
              </>
            )}
            . Return your index fingers to the tactile bumps on <strong>F</strong> and <strong>J</strong>.
          </p>
          <div className="flex flex-wrap gap-2 pt-2 text-xs">
            {['a', 'f', 'j', ';', 'Q', 'Z', '1', '?'].map((ch) => (
              <button
                key={ch}
                type="button"
                onClick={() => {
                  setSampleChar(ch);
                  const g = getTargetKeyGuide(ch);
                  setSelectedKey(g?.keyDef ?? null);
                }}
                className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-canvas)] px-3 py-1.5 font-mono-typing font-semibold hover:border-[var(--accent-primary)]"
              >
                {ch}
              </button>
            ))}
          </div>
        </div>

        <div className="flex justify-center">
          <HandDiagram activeFinger={activeFinger} secondaryFinger={secondaryFinger} />
        </div>
      </div>

      {/* Interactive Virtual Keyboard */}
      <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-6">
        <VirtualKeyboard
          mode="interactive"
          activePressedCodes={pressedCodes}
          targetChar={sampleChar}
          onKeySelect={(k) => {
            setSelectedKey(k);
            if (k.char) setSampleChar(k.char);
            soundEngine.playKeyClick(preferences.soundEnabled, true);
          }}
        />
      </div>

      {/* Ergonomic Rules */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-5 space-y-2">
          <h2 className="font-bold text-[var(--text-primary)]">1. Home Row Anchors</h2>
          <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
            Left fingers rest on A, S, D, F. Right fingers rest on J, K, L, ;. Thumbs hover naturally over the spacebar.
          </p>
        </div>
        <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-5 space-y-2">
          <h2 className="font-bold text-[var(--text-primary)]">2. Opposite-Hand Shift</h2>
          <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
            Use your right pinky on Right Shift for left-hand capitals (like Q, A, Z), and left pinky on Left Shift for right-hand capitals.
          </p>
        </div>
        <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-5 space-y-2">
          <h2 className="font-bold text-[var(--text-primary)]">3. Eyes on Screen</h2>
          <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
            Resist glancing down at the keys. Feel the F and J bumps to realign your hands whenever you lose your place.
          </p>
        </div>
      </div>
    </div>
  );
};
