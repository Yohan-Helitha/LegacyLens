import React, { useState, useRef } from 'react';
import {
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  StatusBar,
  Switch,
  ImageBackground,
  Alert,
  Share,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import MapView from 'react-native-maps';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Colors, Typography, Spacing, Radii } from '../../../theme';
import { styles } from './CreateOpportunityScreen.styles';
const KNOWLEDGE_HOLDERS = [
  {
    "id": "kh1",
    "name": "Dr. Sunil Ariyaratne",
    "role": "Traditional Dance Master",
    "location": "Kandy",
    "verified": true,
    "image": "https://lh3.googleusercontent.com/aida-public/AB6AXuDt8Ue9Wvwc8kK_bKxgX65wT_vD3lO1_qVd_1Y1qC3x7N8wK_x5qN6Vd_1Y1qC3x7N8wK_x5qN6Vd_1Y1qC3x7N8wK_x5q"
  },
  {
    "id": "kh2",
    "name": "Mrs. Kamala Perera",
    "role": "Culinary Heritage Expert",
    "location": "Galle",
    "verified": true,
    "image": "https://lh3.googleusercontent.com/aida-public/AB6AXuCP68zF6Gx2bvH0fVStHJXGnBk5k_zSJg9JGpVV_809FYAbsWYy07BPZju5VzHAh0a3DsWveaJuEjyGZZuqsEJK63MJTxJ8oCdRaLzuOqiEPkZjrQZbSry6dS7t3kk18Z23_FVbDtwh1ltzKXc_ucCq8Q6epXt5apHZzXR6wBeAoHsvijSJzyy7b_DOS2II3W_dmHBW_4KryJA7_7PDvzAoPgp4ylZTV3AZjsRq8m_Cc_xV9mRXNloj"
  }
];
import { useOpportunity } from '../../../context/OpportunityContext';

export const CreateOpportunityScreen: React.FC<{ onNavigate?: (tab: string) => void }> = ({ onNavigate }) => {
  const [step, setStep] = useState(1);
  const [isFlexibleSchedule, setIsFlexibleSchedule] = useState(false);
  const [coverImage, setCoverImage] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [opportunityTitle, setOpportunityTitle] = useState('');
  const [selectedKnowledgeHolder, setSelectedKnowledgeHolder] = useState<string | null>(null);
  const [mapRegion, setMapRegion] = useState({
    latitude: 6.9271,
    longitude: 79.8612,
    latitudeDelta: 0.05,
    longitudeDelta: 0.05,
  });
  const [locationText, setLocationText] = useState('Colombo, Sri Lanka');
  const [isLocationSaved, setIsLocationSaved] = useState(false);
  const [scheduleDate, setScheduleDate] = useState<Date | null>(null);
  const [scheduleDuration, setScheduleDuration] = useState('');
  const [scheduleStartTime, setScheduleStartTime] = useState<Date | null>(null);
  const [scheduleEndTime, setScheduleEndTime] = useState<Date | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showStartTimePicker, setShowStartTimePicker] = useState(false);
  const [showEndTimePicker, setShowEndTimePicker] = useState(false);
  const [selectedPerks, setSelectedPerks] = useState<string[]>([]);
  const [tasks, setTasks] = useState<string[]>(['']);
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [selectedDeliverables, setSelectedDeliverables] = useState<string[]>([]);
  const [preservationDescription, setPreservationDescription] = useState('');

  const { saveDraft, getActiveDraft, activeDraftId, setActiveDraftId, originTab } = useOpportunity();

  React.useEffect(() => {
    const draft = getActiveDraft();
    if (draft) {
      setOpportunityTitle(draft.opportunityTitle || '');
      setCoverImage(draft.coverImage || null);
      setSelectedCategory(draft.selectedCategory || null);
      setSelectedKnowledgeHolder(draft.selectedKnowledgeHolder || null);
      if (draft.mapRegion) setMapRegion(draft.mapRegion);
      if (draft.locationText) setLocationText(draft.locationText);
      setScheduleDate(draft.scheduleDate ? new Date(draft.scheduleDate) : null);
      setScheduleStartTime(draft.scheduleStartTime ? new Date(draft.scheduleStartTime) : null);
      setScheduleEndTime(draft.scheduleEndTime ? new Date(draft.scheduleEndTime) : null);
      setScheduleDuration(draft.scheduleDuration || '');
      setIsFlexibleSchedule(draft.isFlexibleSchedule || false);
      setSelectedSkills(draft.selectedSkills || []);
      setTasks(draft.tasks?.length ? draft.tasks : ['']);
      setSelectedDeliverables(draft.selectedDeliverables || []);
      setPreservationDescription(draft.preservationDescription || '');
    } else {
      // Reset form if no active draft
      setStep(1);
      setOpportunityTitle('');
      setCoverImage(null);
      setSelectedCategory(null);
      setSelectedKnowledgeHolder(null);
      setScheduleDate(null);
      setScheduleStartTime(null);
      setScheduleEndTime(null);
      setScheduleDuration('');
      setIsFlexibleSchedule(false);
      setSelectedSkills([]);
      setTasks(['']);
      setSelectedDeliverables([]);
      setPreservationDescription('');
    }
  }, [activeDraftId]);

  const handleSaveDraft = () => {
    saveDraft({
      id: activeDraftId || undefined,
      opportunityTitle,
      coverImage,
      selectedCategory,
      selectedKnowledgeHolder,
      mapRegion,
      locationText,
      scheduleDate: scheduleDate ? scheduleDate.toISOString() : null,
      scheduleStartTime: scheduleStartTime ? scheduleStartTime.toISOString() : null,
      scheduleEndTime: scheduleEndTime ? scheduleEndTime.toISOString() : null,
      scheduleDuration,
      isFlexibleSchedule,
      selectedSkills,
      tasks,
      selectedDeliverables,
      preservationDescription,
    });
    onNavigate?.('drafts');
  };

  const mapRef = useRef<MapView>(null);

  const formatTime = (date: Date | null) => {
    if (!date) return '';
    let hours = date.getHours();
    let minutes = date.getMinutes();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12;
    const strMins = minutes < 10 ? '0' + minutes : minutes;
    return `${hours}:${strMins} ${ampm}`;
  };

  const formatDate = (date: Date | null) => {
    if (!date) return '';
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${months[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
  };

  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [16, 9],
      quality: 0.8,
    });

    if (!result.canceled) {
      setCoverImage(result.assets[0].uri);
    }
  };

  const nextStep = () => {
    if (step === 1) {
      if (!opportunityTitle.trim() || !coverImage || !selectedCategory) {
        Alert.alert('Incomplete Fields', 'Please fill in all fields (Title, Cover Image, and Category).');
        return;
      }
    } else if (step === 2) {
      if (!selectedKnowledgeHolder) {
        Alert.alert('Incomplete Fields', 'Please select a knowledge holder.');
        return;
      }
    } else if (step === 3) {
      if (!isLocationSaved) {
        Alert.alert('Incomplete Fields', 'Please save a location on the map.');
        return;
      }
      if (!isFlexibleSchedule) {
        if (!scheduleDate || !scheduleDuration.trim() || !scheduleStartTime || !scheduleEndTime) {
          Alert.alert('Incomplete Fields', 'Please complete all schedule fields or toggle "Flexible schedule".');
          return;
        }
      }
    } else if (step === 4) {
      if (!preservationDescription.trim()) {
        Alert.alert('Incomplete Fields', 'Please provide a preservation description.');
        return;
      }
      if (tasks.filter(t => t.trim() !== '').length === 0) {
        Alert.alert('Incomplete Fields', 'Please add at least one specific task.');
        return;
      }
      if (selectedSkills.length === 0) {
        Alert.alert('Incomplete Fields', 'Please select at least one required skill.');
        return;
      }
      if (selectedDeliverables.length === 0) {
        Alert.alert('Incomplete Fields', 'Please select at least one expected deliverable.');
        return;
      }
    }
    setStep((prev) => Math.min(prev + 1, 6));
  };
  const prevStep = () => {
    if (step > 1) {
      setStep((prev) => prev - 1);
    } else {
      onNavigate?.(originTab);
    }
  };

  const handleLocationSearch = async () => {
    if (!locationText.trim()) return;
    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(locationText)}`, {
        headers: {
          'User-Agent': 'LegacyLensApp/1.0',
        }
      });
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const data = await response.json();
      if (data && data.length > 0) {
        const firstResult = data[0];
        const newRegion = {
          latitude: parseFloat(firstResult.lat),
          longitude: parseFloat(firstResult.lon),
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        };
        setMapRegion(newRegion);
        mapRef.current?.animateToRegion(newRegion, 1000);
        setIsLocationSaved(false);
      } else {
        Alert.alert('Location Not Found', 'Could not find the location you searched for.');
      }
    } catch (error) {
      console.error('Error searching location:', error);
      Alert.alert('Error', 'Failed to search location.');
    }
  };

  const ProgressBar = ({ current, total = 4 }: { current: number, total?: number }) => (
    <View style={styles.progressContainer}>
      <View style={styles.progressBarsRow}>
        {[...Array(total)].map((_, index) => (
          <View
            key={index}
            style={[
              styles.progressBarSegment,
              index < current ? styles.progressBarActive : styles.progressBarInactive,
            ]}
          />
        ))}
      </View>
      <Text style={styles.progressText}>Step {current} of {total}</Text>
    </View>
  );

  // ────────────────────────────────────────────────────────────────────────
  // Step 1: Create Opportunity
  // ────────────────────────────────────────────────────────────────────────
  const renderStep1 = () => (
    <>
      <View style={styles.header}>
        <TouchableOpacity style={styles.iconButton} onPress={prevStep}>
          <MaterialIcons name="arrow-back" size={24} color={Colors.textMuted} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Create Opportunity</Text>
        <TouchableOpacity style={styles.saveDraftButton} onPress={handleSaveDraft}>
          <Text style={styles.saveDraftText}>Save Draft</Text>
        </TouchableOpacity>
      </View>
      <ProgressBar current={1} />
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.welcomeCard}>
          <Text style={styles.welcomeText}>
            Let's create something worth preserving. Tell people what cultural knowledge you want to document and how they can help.
          </Text>
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Opportunity Title</Text>
          <TextInput
            style={styles.textInput}
            placeholder="e.g. Documenting traditional clay pottery techniques"
            placeholderTextColor="rgba(107, 113, 120, 0.5)"
            value={opportunityTitle}
            onChangeText={setOpportunityTitle}
          />
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Cover Image</Text>
          <TouchableOpacity style={styles.imageUploadArea} activeOpacity={0.7} onPress={pickImage}>
            {coverImage ? (
              <Image source={{ uri: coverImage }} style={{ width: '100%', height: '100%', borderRadius: Radii.xl }} />
            ) : (
              <>
                <MaterialIcons name="add-photo-alternate" size={40} color={Colors.textMuted} />
                <Text style={styles.imageUploadText}>Add cover image</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.formGroup}>
          <Text style={styles.label}>Preservation Category</Text>
          <View style={styles.chipGroup}>
            {['Craft', 'Food', 'Language', 'Tradition', 'Music', 'Dance', 'Agriculture', 'Ritual', 'Folk Knowledge'].map((cat, index) => {
              const isSelected = selectedCategory === cat;
              return (
                <TouchableOpacity 
                  key={index} 
                  style={isSelected ? styles.chipActive : styles.chip}
                  onPress={() => setSelectedCategory(isSelected ? null : cat)}
                >
                  <Text style={isSelected ? styles.chipActiveText : styles.chipText}>{cat}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </ScrollView>
      <View style={styles.bottomBar}>
        <TouchableOpacity style={styles.bottomBtnSecondary} onPress={handleSaveDraft}>
          <Text style={styles.bottomBtnSecondaryText}>Save Draft</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.bottomBtnPrimary} onPress={nextStep}>
          <Text style={styles.bottomBtnPrimaryText}>Continue</Text>
        </TouchableOpacity>
      </View>
    </>
  );

  // ────────────────────────────────────────────────────────────────────────
  // Step 2: Knowledge Holder
  // ────────────────────────────────────────────────────────────────────────
  const renderStep2 = () => (
    <>
      <View style={styles.header}>
        <TouchableOpacity style={styles.iconButton} onPress={prevStep}>
          <MaterialIcons name="close" size={24} color={Colors.secondary} />
        </TouchableOpacity>
     
        <TouchableOpacity style={styles.saveDraftButton} onPress={handleSaveDraft}>
          <Text style={styles.saveDraftText}>Save Draft</Text>
        </TouchableOpacity>
      </View>
      <ProgressBar current={2} />
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.titleSection}>
          <Text style={styles.pageTitle}>Who carries this knowledge?</Text>
          <Text style={styles.pageSubtitle}>Tell participants who they will be learning from or documenting.</Text>
        </View>

        <View style={styles.searchBarContainer}>
          <MaterialIcons name="search" size={20} color={Colors.textMuted} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Select a knowledge holder..."
            placeholderTextColor={Colors.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        <View style={styles.profilesGrid}>
          {KNOWLEDGE_HOLDERS
            .filter(kh => 
              kh.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
              kh.role.toLowerCase().includes(searchQuery.toLowerCase()) || 
              kh.location.toLowerCase().includes(searchQuery.toLowerCase())
            )
            .map((kh) => (
              <TouchableOpacity 
                key={kh.id} 
                style={[styles.profileCard, selectedKnowledgeHolder === kh.id && { borderColor: '#fe893e', backgroundColor: 'rgba(254, 137, 62, 0.05)' }]} 
                activeOpacity={0.8}
                onPress={() => setSelectedKnowledgeHolder(kh.id)}
              >
                <View style={[styles.profileAvatarContainer, { overflow: 'hidden' }]}>
                  {kh.image ? (
                    <Image source={{ uri: kh.image }} style={{ width: '100%', height: '100%' }} />
                  ) : (
                    <MaterialIcons name="person" size={32} color={Colors.textMuted} />
                  )}
                </View>
                <View style={styles.profileInfo}>
                  <View style={styles.profileNameRow}>
                    <Text style={styles.profileName}>{kh.name}</Text>
                    {kh.verified && <MaterialIcons name="verified" size={16} color="#fe893e" />}
                  </View>
                  <Text style={styles.profileRole}>{kh.role}</Text>
                  <View style={styles.profileLocationRow}>
                    <MaterialIcons name="location-on" size={12} color={Colors.textMuted} />
                    <Text style={styles.profileLocation}>{kh.location}</Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
        </View>

      </ScrollView>
      <View style={styles.bottomBar}>
        <TouchableOpacity style={[styles.bottomBtnSecondary, {flex: 0, paddingHorizontal: Spacing.xl}]} onPress={prevStep}>
          <Text style={styles.bottomBtnSecondaryText}>Back</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.bottomBtnPrimary} onPress={nextStep}>
          <Text style={styles.bottomBtnPrimaryText}>Continue</Text>
        </TouchableOpacity>
      </View>
    </>
  );

  // ────────────────────────────────────────────────────────────────────────
  // Step 3: Location & Schedule
  // ────────────────────────────────────────────────────────────────────────
  const renderStep3 = () => (
    <>
      <View style={styles.header}>
        <TouchableOpacity style={styles.iconButton} onPress={prevStep}>
          <MaterialIcons name="arrow-back" size={24} color={Colors.textMuted} />
        </TouchableOpacity>
    
        <TouchableOpacity style={styles.saveDraftButton} onPress={handleSaveDraft}>
          <Text style={styles.saveDraftText}>Save Draft</Text>
        </TouchableOpacity>
      </View>
      <ProgressBar current={3} />
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.titleSection}>
          <Text style={styles.pageTitle}>Plan the experience</Text>
          <Text style={styles.pageSubtitle}>Give participants everything they need to know before they apply.</Text>
        </View>

        <View style={styles.cardSection}>
          <View style={styles.sectionTitleRow}>
            <MaterialIcons name="pin-drop" size={20} color="#fe893e" />
            <Text style={styles.sectionTitle}>Where will this happen?</Text>
          </View>
          <View style={styles.searchBarContainerBordered}>
            <TouchableOpacity onPress={handleLocationSearch}>
              <MaterialIcons name="search" size={20} color={Colors.textMuted} style={styles.searchIcon} />
            </TouchableOpacity>
            <TextInput 
              style={styles.searchInputBordered} 
              value={locationText}
              onChangeText={setLocationText}
              placeholder="Search location..."
              onSubmitEditing={handleLocationSearch}
              returnKeyType="search"
            />
          </View>
          <View style={[styles.mapPreviewBox, { overflow: 'hidden' }]}>
            <MapView
              ref={mapRef}
              style={{ flex: 1, width: '100%', height: '100%' }}
              initialRegion={mapRegion}
              scrollEnabled={!isLocationSaved}
              zoomEnabled={!isLocationSaved}
              pitchEnabled={!isLocationSaved}
              rotateEnabled={!isLocationSaved}
              onRegionChangeComplete={(region) => {
                setMapRegion(region);
              }}
            />
            {/* Center pointer overlay */}
            <View style={{ position: 'absolute', top: '50%', left: '50%', marginTop: -24, marginLeft: -16, alignItems: 'center' }} pointerEvents="none">
              <MaterialIcons name="location-on" size={32} color={isLocationSaved ? "#2e7d32" : "#fe893e"} />
              {!isLocationSaved && <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: 'rgba(0,0,0,0.3)', marginTop: -6 }} />}
            </View>
          </View>
          {/* Save Location Button */}
          <View style={{ alignItems: 'flex-end', marginTop: 12 }}>
            <TouchableOpacity 
              style={{ backgroundColor: isLocationSaved ? '#2e7d32' : Colors.secondary, paddingHorizontal: 16, paddingVertical: 8, borderRadius: Radii.md, flexDirection: 'row', alignItems: 'center', gap: 6, elevation: 2, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 2, shadowOffset: {width:0, height:1} }}
              onPress={() => setIsLocationSaved(!isLocationSaved)}
              activeOpacity={0.8}
            >
              <MaterialIcons name={isLocationSaved ? 'edit' : 'my-location'} size={18} color={Colors.white} />
              <Text style={{ fontFamily: Typography.fontBodyMed, color: Colors.white, fontSize: 13 }}>{isLocationSaved ? 'Change' : 'Save Location'}</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.cardSection}>
          <View style={styles.sectionHeaderRowSpaceBetween}>
            <View style={styles.sectionTitleRow}>
              <MaterialIcons name="calendar-month" size={20} color="#fe893e" />
              <Text style={styles.sectionTitle}>Schedule</Text>
            </View>
            <View style={styles.switchRow}>
              <Text style={styles.switchLabel}>Flexible schedule</Text>
              <Switch
                value={isFlexibleSchedule}
                onValueChange={setIsFlexibleSchedule}
                trackColor={{ false: '#e1e3e2', true: '#fe893e' }}
                thumbColor="#FFFFFF"
              />
            </View>
          </View>
          <View style={styles.scheduleGrid}>
            <View style={styles.scheduleBox}>
              <Text style={styles.scheduleLabel}>Date</Text>
              <TouchableOpacity style={styles.scheduleValueRow} onPress={() => setShowDatePicker(true)}>
                <MaterialIcons name="event" size={20} color={Colors.secondary} />
                <Text style={[styles.scheduleValue, !scheduleDate && { color: Colors.textMuted }]}>
                  {scheduleDate ? formatDate(scheduleDate) : 'e.g. Aug 25'}
                </Text>
              </TouchableOpacity>
              {showDatePicker && (
                <DateTimePicker
                  value={scheduleDate || new Date()}
                  mode="date"
                  display="default"
                  minimumDate={new Date()}
                  onChange={(event: any, date?: Date) => {
                    setShowDatePicker(false);
                    if (event.type === 'set' && date) setScheduleDate(date);
                  }}
                />
              )}
            </View>
            <View style={styles.scheduleBox}>
              <Text style={styles.scheduleLabel}>Duration</Text>
              <View style={styles.scheduleValueRow}>
                <MaterialIcons name="timer" size={20} color={Colors.secondary} />
                <TextInput style={styles.scheduleValue} placeholder="e.g. 3-4 hours" placeholderTextColor={Colors.textMuted} value={scheduleDuration} onChangeText={setScheduleDuration} />
              </View>
            </View>
            <View style={styles.scheduleBox}>
              <Text style={styles.scheduleLabel}>Start time</Text>
              <TouchableOpacity style={styles.scheduleValueRow} onPress={() => setShowStartTimePicker(true)}>
                <MaterialIcons name="schedule" size={20} color={Colors.secondary} />
                <Text style={[styles.scheduleValue, !scheduleStartTime && { color: Colors.textMuted }]}>
                  {scheduleStartTime ? formatTime(scheduleStartTime) : 'e.g. 10:00 AM'}
                </Text>
              </TouchableOpacity>
              {showStartTimePicker && (
                <DateTimePicker
                  value={scheduleStartTime || new Date()}
                  mode="time"
                  display="default"
                  onChange={(event: any, date?: Date) => {
                    setShowStartTimePicker(false);
                    if (event.type === 'set' && date) setScheduleStartTime(date);
                  }}
                />
              )}
            </View>
            <View style={styles.scheduleBox}>
              <Text style={styles.scheduleLabel}>End time</Text>
              <TouchableOpacity style={styles.scheduleValueRow} onPress={() => setShowEndTimePicker(true)}>
                <MaterialIcons name="update" size={20} color={Colors.secondary} />
                <Text style={[styles.scheduleValue, !scheduleEndTime && { color: Colors.textMuted }]}>
                  {scheduleEndTime ? formatTime(scheduleEndTime) : 'e.g. 1:00 PM'}
                </Text>
              </TouchableOpacity>
              {showEndTimePicker && (
                <DateTimePicker
                  value={scheduleEndTime || new Date()}
                  mode="time"
                  display="default"
                  onChange={(event: any, date?: Date) => {
                    setShowEndTimePicker(false);
                    if (event.type === 'set' && date) setScheduleEndTime(date);
                  }}
                />
              )}
            </View>
          </View>
        </View>

        <View style={styles.cardSection}>
          <View style={styles.sectionTitleRow}>
            <MaterialIcons name="payments" size={20} color="#fe893e" />
            <Text style={styles.sectionTitle}>What will participants receive?</Text>
          </View>
          <View style={styles.chipGroup}>
            {['Paid', 'Certificate', 'Meals Provided', 'Transport', 'Accommodation'].map(perk => {
              const isSelected = selectedPerks.includes(perk);
              return (
                <TouchableOpacity 
                  key={perk} 
                  style={isSelected ? styles.chipActive : styles.chip}
                  onPress={() => setSelectedPerks(prev => prev.includes(perk) ? prev.filter(p => p !== perk) : [...prev, perk])}
                >
                  <Text style={isSelected ? styles.chipActiveText : styles.chipText}>{perk}</Text>
                </TouchableOpacity>
              )
            })}
          </View>
          <View style={styles.amountInputContainer}>
            <Text style={styles.label}>Amount (LKR)</Text>
            <View style={styles.amountInputRow}>
              <Text style={styles.currencyPrefix}>Rs.</Text>
              <TextInput style={styles.amountInput} value="3500" keyboardType="numeric" />
            </View>
          </View>
        </View>
      </ScrollView>
      <View style={styles.bottomBar}>
        <TouchableOpacity style={[styles.bottomBtnSecondary, {flex: 0, paddingHorizontal: Spacing.xl}]} onPress={prevStep}>
          <Text style={styles.bottomBtnSecondaryText}>Back</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.bottomBtnPrimary} onPress={nextStep}>
          <Text style={styles.bottomBtnPrimaryText}>Continue</Text>
        </TouchableOpacity>
      </View>
    </>
  );

  // ────────────────────────────────────────────────────────────────────────
  // Step 4: Tell the story
  // ────────────────────────────────────────────────────────────────────────
  const renderStep4 = () => (
    <>
      <View style={styles.header}>
        <TouchableOpacity style={styles.iconButton} onPress={prevStep}>
          <MaterialIcons name="arrow-back" size={24} color={Colors.textMuted} />
        </TouchableOpacity>
       
        <TouchableOpacity style={styles.saveDraftButton} onPress={handleSaveDraft}>
          <Text style={styles.saveDraftText}>Save Draft</Text>
        </TouchableOpacity>
      </View>
      <ProgressBar current={4} />
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.titleSection}>
          <Text style={styles.pageTitle}>Tell the story</Text>
          <Text style={styles.pageSubtitle}>Help the right person understand why this opportunity matters.</Text>
        </View>

        <View style={styles.cardSection}>
          <Text style={styles.cardLabelBold}>Preservation Description</Text>
          <TextInput
            style={styles.textArea}
            multiline
            numberOfLines={5}
            placeholder="Describe the historical context, the location, and why preserving this memory is crucial..."
            placeholderTextColor="rgba(107, 113, 120, 0.5)"
            textAlignVertical="top"
            value={preservationDescription}
            onChangeText={setPreservationDescription}
          />
          <Text style={styles.charCount}>0/500</Text>
        </View>

        <View style={styles.cardSection}>
          <Text style={styles.cardLabelBold}>What will they do?</Text>
          <Text style={styles.cardSubtitle}>Outline the specific steps required to complete this preservation task.</Text>
          <View style={styles.taskList}>
            {tasks.map((task, idx) => (
              <View key={idx} style={styles.taskItem}>
                <View style={styles.taskNumberCircle}><Text style={styles.taskNumberText}>{idx + 1}</Text></View>
                <TextInput 
                  style={styles.taskInput} 
                  placeholder="Describe a task step..."
                  value={task}
                  onChangeText={(val) => {
                    const newTasks = [...tasks];
                    newTasks[idx] = val;
                    setTasks(newTasks);
                  }}
                />
                <TouchableOpacity onPress={() => setTasks(tasks.length > 1 ? tasks.filter((_, i) => i !== idx) : [''])}>
                  <MaterialIcons name="close" size={20} color={Colors.textMuted} />
                </TouchableOpacity>
              </View>
            ))}
          </View>
          <TouchableOpacity style={styles.addTaskBtn} onPress={() => setTasks([...tasks, ''])}>
            <MaterialIcons name="add" size={18} color="#fe893e" />
            <Text style={styles.addTaskBtnText}>Add another task</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.cardSection}>
          <Text style={styles.cardLabelBold}>Required Skills</Text>
          <Text style={styles.cardSubtitle}>Select the skills needed for this opportunity.</Text>
          <View style={styles.chipGroup}>
            {['Photography', 'Videography', 'Documentation', 'Translation (Sinhala/English)', 'Interviews'].map(skill => {
              const isSelected = selectedSkills.includes(skill);
              return (
                <TouchableOpacity 
                  key={skill}
                  style={isSelected ? styles.chipActive : styles.chip}
                  onPress={() => setSelectedSkills(prev => prev.includes(skill) ? prev.filter(s => s !== skill) : [...prev, skill])}
                >
                  <Text style={isSelected ? styles.chipActiveText : styles.chipText}>{skill}</Text>
                </TouchableOpacity>
              )
            })}
          </View>
        </View>

        <View style={styles.cardSection}>
          <Text style={styles.cardLabelBold}>Expected Deliverables</Text>
          <Text style={styles.cardSubtitle}>What tangible assets should the volunteer produce?</Text>
          <View style={styles.deliverablesList}>
            {[
              'Minimum 15 high-resolution photos',
              '3-5 minute edited video summary',
              'Written site documentation (500 words)',
              'Audio interviews with locals',
            ].map((item, idx) => {
              const isChecked = selectedDeliverables.includes(item);
              return (
                <TouchableOpacity 
                  key={idx} 
                  style={styles.checkItemRow} 
                  activeOpacity={0.8}
                  onPress={() => setSelectedDeliverables(prev => prev.includes(item) ? prev.filter(d => d !== item) : [...prev, item])}
                >
                  <View style={[styles.checkbox, isChecked && styles.checkboxChecked]}>
                    {isChecked && <MaterialIcons name="check" size={16} color={Colors.white} />}
                  </View>
                  <Text style={styles.checkItemText}>{item}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </ScrollView>
      <View style={styles.bottomBarSpaceBetween}>
        <TouchableOpacity style={[styles.bottomBtnSecondary, { flex: 0, paddingHorizontal: Spacing.xl }]} onPress={prevStep}>
          <Text style={styles.bottomBtnSecondaryText}>Back</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.btnActionPrimary} onPress={nextStep}>
          <Text style={styles.btnActionPrimaryText}>Review Opportunity</Text>
          <MaterialIcons name="arrow-forward" size={20} color={Colors.white} />
        </TouchableOpacity>
      </View>
    </>
  );

  // ────────────────────────────────────────────────────────────────────────
  // Step 5: Review & Publish
  // ────────────────────────────────────────────────────────────────────────
  const renderStep5 = () => {
    const selectedKH = KNOWLEDGE_HOLDERS.find(kh => kh.id === selectedKnowledgeHolder);
    
    const checklist = [
      { label: 'Clear title', done: opportunityTitle.trim().length > 0 },
      { label: 'Cover image added', done: !!coverImage },
      { label: 'Verified knowledge holder', done: !!selectedKH },
      { label: 'Location pinned', done: isLocationSaved },
      { label: 'Schedule configured', done: isFlexibleSchedule || !!(scheduleDate && scheduleStartTime && scheduleEndTime) },
      { label: 'Detailed description', done: preservationDescription.trim().length > 20, optional: true },
      { label: 'Expected deliverables', done: selectedDeliverables.length > 0, optional: true },
    ];
    const score = Math.round((checklist.filter(c => c.done).length / checklist.length) * 100);

    return (
    <>
      <View style={styles.header}>
        <TouchableOpacity style={styles.iconButton} onPress={prevStep}>
          <MaterialIcons name="close" size={24} color={Colors.textMuted} />
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.saveDraftButton} onPress={handleSaveDraft}>
          <Text style={styles.saveDraftText}>Save Draft</Text>
        </TouchableOpacity>
      </View>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.titleSection}>
          <Text style={styles.pageTitle}>Review & Publish</Text>
          <Text style={styles.pageSubtitle}>Your opportunity is ready. Review how participants will see it.</Text>
        </View>

        <View style={styles.cardSection}>
          <View style={styles.qualityRow}>
            <Text style={styles.qualityLabel}>Opportunity quality</Text>
            <Text style={styles.qualityPercent}>{score}%</Text>
          </View>
          <View style={styles.qualityBarBg}>
            <View style={[styles.qualityBarFill, { width: `${score}%` }]} />
          </View>
          <View style={styles.checklist}>
            {checklist.map((item, idx) => (
              <View key={idx} style={styles.checklistItem}>
                <MaterialIcons 
                  name={item.done ? "check-circle" : "radio-button-unchecked"} 
                  size={18} 
                  color={item.done ? Colors.secondary : Colors.textMuted} 
                />
                <Text style={item.done ? styles.checklistText : styles.checklistTextMuted}>
                  {item.label} {item.optional && !item.done ? '(Optional)' : ''}
                </Text>
              </View>
            ))}
          </View>
        </View>

        <Text style={styles.sectionHeading}>Live Preview</Text>
        <View style={styles.previewCard}>
          <View style={styles.previewTag}>
            <MaterialIcons name="visibility" size={14} color={Colors.textMuted} />
            <Text style={styles.previewTagText}>PREVIEW</Text>
          </View>
          <ImageBackground
            source={{ uri: coverImage || 'https://lh3.googleusercontent.com/aida-public/AB6AXuCP68zF6Gx2bvH0fVStHJXGnBk5k_zSJg9JGpVV_809FYAbsWYy07BPZju5VzHAh0a3DsWveaJuEjyGZZuqsEJK63MJTxJ8oCdRaLzuOqiEPkZjrQZbSry6dS7t3kk18Z23_FVbDtwh1ltzKXc_ucCq8Q6epXt5apHZzXR6wBeAoHsvijSJzyy7b_DOS2II3W_dmHBW_4KryJA7_7PDvzAoPgp4ylZTV3AZjsRq8m_Cc_xV9mRXNloj' }}
            style={styles.previewImage}
          />
          <View style={styles.previewContent}>
            <View style={styles.previewHostRow}>
              <View style={[styles.previewHostAvatar, { backgroundColor: '#eceeed', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }]}>
                {selectedKH?.image ? (
                  <Image source={{ uri: selectedKH.image }} style={{ width: '100%', height: '100%' }} />
                ) : (
                  <MaterialIcons name="person" size={24} color={Colors.textMuted} />
                )}
              </View>
              <View>
                <Text style={styles.previewHostName}>Hosted by {selectedKH ? selectedKH.name.split(' ')[1] : 'Someone'}</Text>
                <View style={styles.previewLocationRow}>
                  <MaterialIcons name="location-on" size={12} color={Colors.textMuted} />
                  <Text style={styles.previewLocation}>{selectedKH ? selectedKH.location : 'Unknown'}, Sri Lanka</Text>
                </View>
              </View>
            </View>
            <Text style={styles.previewTitle}>{opportunityTitle || 'Untitled Opportunity'}</Text>
            <Text style={styles.previewDesc} numberOfLines={2}>
              Join an immersive session to document and preserve vital cultural knowledge with a verified master artisan.
            </Text>
            <View style={styles.previewBottomRow}>
              <View style={styles.previewBadgesRow}>
                <View style={styles.previewBadge}><Text style={styles.previewBadgeText}>{selectedCategory || 'Cultural'}</Text></View>
                <View style={styles.previewBadge}><MaterialIcons name="schedule" size={12} color={Colors.textMuted} /><Text style={styles.previewBadgeText}>3 hrs</Text></View>
              </View>
              <Text style={styles.previewPrice}>LKR 3,500</Text>
            </View>
          </View>
        </View>

      </ScrollView>
      <View style={styles.bottomBarSpaceBetween}>
        <TouchableOpacity style={styles.btnActionSecondary} onPress={prevStep}>
          <MaterialIcons name="edit" size={20} color={Colors.secondary} />
          <Text style={styles.btnActionSecondaryText}>Edit details</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.btnActionPrimary} onPress={nextStep}>
          <Text style={styles.btnActionPrimaryText}>Publish Opportunity</Text>
          <MaterialIcons name="check" size={20} color={Colors.white} />
        </TouchableOpacity>
      </View>
    </>
  );
};

  // ────────────────────────────────────────────────────────────────────────
  // Step 6: Published Success
  // ────────────────────────────────────────────────────────────────────────
  const renderStep6 = () => {
    const selectedKH = KNOWLEDGE_HOLDERS.find(kh => kh.id === selectedKnowledgeHolder);
    return (
    <View style={styles.successContainer}>
      <View style={styles.successIconBox}>
        <MaterialIcons name="check-circle" size={48} color={Colors.secondary} />
      </View>
      <Text style={styles.successTitle}>Your opportunity is now part of Legacy Lens.</Text>
      <Text style={styles.successSubtitle}>Someone can now help preserve this knowledge for the generations ahead.</Text>

      <View style={styles.successCard}>
        <Image source={{ uri: coverImage || 'https://lh3.googleusercontent.com/aida-public/AB6AXuA2eHWgprmT-eZ-gPeztEDmvJEI7QO38bzognKTuXbt7LM4g_1Gp14KWl0lpa5hdQS-RJbRgewgi8gh4fC5npq5nxXICHwO34nPBnWxwmq6BlfWuaD210-XIq2zirwIXwr_TgbdrCYnGo2-_IO-KENJ8e-WyYOOZlfJvZcFZiQ0g24_V-cbW08KXQSqj72qKppnWpDvW0FJ1jFQmsvp-HMHtOV_m6TtJn_hiExVCXoX16AYATUnvzzi' }} style={styles.successCardImg} />
        <View style={styles.successCardInfo}>
          <Text style={styles.successCardTag}>Preservation Task</Text>
          <Text style={styles.successCardTitle} numberOfLines={1}>{opportunityTitle || 'Untitled Opportunity'}</Text>
          <View style={styles.successLocationRow}>
            <MaterialIcons name="location-on" size={14} color={Colors.textMuted} />
            <Text style={styles.successLocationText} numberOfLines={1}>{selectedKH ? selectedKH.location : 'Unknown Location'}</Text>
          </View>
        </View>
      </View>

      <View style={styles.successActions}>
        <TouchableOpacity style={styles.btnFullPrimary} onPress={async () => {
          try {
            await Share.share({
              message: `Check out this preservation opportunity: ${opportunityTitle || 'Legacy Lens Opportunity'}!`,
            });
          } catch (error: any) {
            Alert.alert(error.message);
          }
        }}>
          <MaterialIcons name="share" size={20} color={Colors.white} />
          <Text style={styles.btnFullPrimaryText}>Share Opportunity</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.btnFullOutline}>
          <MaterialIcons name="visibility" size={20} color={Colors.secondary} />
          <Text style={styles.btnFullOutlineText}>View Opportunity</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.btnTextOnlyCenter} onPress={() => {
          if (onNavigate) {
            onNavigate('intake');
          } else {
            setStep(1);
          }
        }}>
          <Text style={styles.btnTextOnlyCenterText}>Done</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

  return (
    <View style={styles.safeArea}>
      {step === 1 ? renderStep1() : null}
      {step === 2 ? renderStep2() : null}
      {step === 3 ? renderStep3() : null}
      {step === 4 ? renderStep4() : null}
      {step === 5 ? renderStep5() : null}
      {step === 6 ? renderStep6() : null}
    </View>
  );
};

// ────────────────────────────────────────────────────────────────────────
// Styles
// ────────────────────────────────────────────────────────────────────────

