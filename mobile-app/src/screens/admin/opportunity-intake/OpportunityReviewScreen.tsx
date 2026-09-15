import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image, TextInput } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Typography, Spacing, Radii } from '../../../theme';
import { styles } from './OpportunityReviewScreen.styles';
import { useOpportunity } from '../../../context/OpportunityContext';

export const OpportunityReviewScreen: React.FC<{ onBack: () => void, onApprove?: () => void }> = ({ onBack, onApprove }) => {
  const { setActiveDraftId, setOriginTab } = useOpportunity();
  const [activeTab, setActiveTab] = useState<'auto' | 'manual'>('auto');
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(15);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isPlaying && progress < 45) {
      interval = setInterval(() => {
        setProgress(p => Math.min(p + 1, 45));
      }, 500);
    }
    return () => clearInterval(interval);
  }, [isPlaying, progress]);

  return (
    <View style={styles.safeArea}>
      {/* Top Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.iconBtn}>
          <MaterialIcons name="arrow-back" size={24} color={Colors.textMuted} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Review</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* Identity & Player Block */}
        <View style={styles.playerCard}>
          <Text style={styles.personName}>Mrs. Nirmala Wijesinghe</Text>
          
          <View style={styles.waveformContainer}>
            <View style={styles.timeRow}>
              <Text style={styles.timeTextActive}>04:32</Text>
              <Text style={styles.timeText}>12:48</Text>
            </View>
            <View style={styles.waveform}>
              {Array.from({ length: 45 }).map((_, i) => (
                <View 
                  key={i} 
                  style={[
                    styles.waveBar, 
                    { height: `${Math.max(20, Math.floor(Math.random() * 80) + 20)}%` },
                    i < progress && styles.waveBarActive
                  ]} 
                />
              ))}
            </View>
          </View>
          
          <View style={styles.controls}>
            <TouchableOpacity onPress={() => setProgress(p => Math.max(0, p - 5))}>
              <MaterialIcons name="fast-rewind" size={32} color={Colors.textMuted} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.playBtn} onPress={() => setIsPlaying(!isPlaying)}>
              <MaterialIcons name={isPlaying ? "pause" : "play-arrow"} size={32} color={Colors.white} />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setProgress(p => Math.min(45, p + 5))}>
              <MaterialIcons name="fast-forward" size={32} color={Colors.textMuted} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Transcript Section */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Transcript</Text>
          <TouchableOpacity style={styles.autoBtn}>
            <Text style={styles.autoBtnText}>Auto Transcribe</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.transcriptCard}>
          <Text style={styles.transcriptLabel}>Edit/ Type Transcript</Text>
          <View style={styles.transcriptInputWrapper}>
            <TextInput
              style={styles.transcriptInput}
              multiline
              textAlignVertical="top"
              value={`... so we always waited for the monsoon to pass before collecting the specific type of clay from the riverbank.\n\nThe preparation process takes about three days. First, the kirigaru soil is sifted. Then, we mix it with river sand in a very specific ratio to prevent cracking during firing. My grandmother taught me how to feel the texture to know if it has enough so we always waited for the monsoon to pass before collecting the specific type of clay from the riverbank.`}
            />

          </View>
        </View>

        {/* Metadata Section */}
        <View style={styles.metadataCard}>
          <View style={styles.metadataHeader}>
            <Text style={styles.metadataTitle}>Session Metadata</Text>
          </View>
          <View style={styles.metadataGrid}>
            <View style={styles.metaRowTop}>
              <View style={styles.metaCol}>
                <Text style={styles.metaLabel}>DURATION</Text>
                <Text style={styles.metaValue}>12m 48s</Text>
              </View>
              <View style={styles.metaCol}>
                <Text style={styles.metaLabel}>LANGUAGE</Text>
                <Text style={styles.metaValue}>Sinhala</Text>
              </View>
            </View>
            <View style={styles.metaColFull}>
              <Text style={styles.metaLabel}>LOCATION CONTEXT</Text>
              <Text style={styles.metaValue}>Matara District, Southern Province</Text>
            </View>
          </View>
        </View>

      </ScrollView>

      {/* Bottom Actions */}
      <View style={styles.bottomBar}>
        <View style={styles.actionRowTop}>
          <TouchableOpacity style={styles.rejectBtn}>
            <Text style={styles.rejectText}>Reject</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.clarifyBtn}>
            <Text style={styles.clarifyText}>Request Clarification</Text>
          </TouchableOpacity>
        </View>
        <TouchableOpacity style={styles.approveBtn} onPress={() => {
          setActiveDraftId(null);
          setOriginTab('intake');
          onApprove?.();
        }}>
          <Text style={styles.approveText}>Approve</Text>
          <MaterialIcons name="arrow-forward" size={20} color={Colors.white} />
        </TouchableOpacity>
      </View>
    </View>
  );
};


