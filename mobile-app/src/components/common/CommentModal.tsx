import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  FlatList,
  Image,
  Alert,
} from 'react-native';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import { Colors } from '../../theme';
import { styles } from './CommentModal.styles';
import { homeApi } from '../../services/api/homeApi';

interface Comment {
  id: string;
  author: string;
  avatar: string;
  text: string;
  timeAgo: string;
}

interface CommentModalProps {
  visible: boolean;
  onClose: () => void;
  postId: string;
}

// Banned words for simple community guidelines check
const BANNED_WORDS = ['spam', 'hate', 'abuse', 'stupid', 'idiot'];

export const CommentModal: React.FC<CommentModalProps> = ({ visible, onClose, postId }) => {
  const [commentText, setCommentText] = useState('');
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (visible && postId) {
      fetchComments();
    }
  }, [visible, postId]);

  const fetchComments = async () => {
    try {
      setLoading(true);
      const data = await homeApi.getComments(postId);
      setComments(data);
    } catch (err) {
      console.log('Failed to fetch comments', err);
    } finally {
      setLoading(false);
    }
  };

  const handlePostComment = async () => {
    const trimmed = commentText.trim();
    if (!trimmed) return;

    // Check community guidelines
    const lowerText = trimmed.toLowerCase();
    const violates = BANNED_WORDS.some(word => lowerText.includes(word));
    
    if (violates) {
      Alert.alert(
        'Community Guidelines Violation',
        'Your comment contains inappropriate language and cannot be posted. Please keep the community safe and respectful.'
      );
      return;
    }

    try {
      const newComment = await homeApi.addComment(postId, trimmed);
      setComments([newComment, ...comments]);
      setCommentText('');
    } catch (err) {
      console.log('Failed to post comment', err);
      Alert.alert('Error', 'Could not post comment at this time.');
    }
  };

  const renderComment = ({ item }: { item: Comment }) => (
    <View style={styles.commentRow}>
      <Image source={{ uri: item.avatar }} style={styles.commentAvatar} />
      <View style={styles.commentBubble}>
        <View style={styles.commentHeader}>
          <Text style={styles.commentAuthor}>{item.author}</Text>
          <Text style={styles.commentTime}>{item.timeAgo}</Text>
        </View>
        <Text style={styles.commentText}>{item.text}</Text>
      </View>
    </View>
  );

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.overlay}
      >
        <View style={styles.bottomSheet}>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Comments</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <MaterialIcons name="close" size={28} color={Colors.text} />
            </TouchableOpacity>
          </View>

          <FlatList
            data={comments}
            keyExtractor={(item) => item.id}
            renderItem={renderComment}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
          />

          <View style={styles.inputSection}>
            <Image
              source={{ uri: 'https://i.pravatar.cc/150?img=1' }}
              style={styles.currentUserAvatar}
            />
            <View style={styles.inputWrapper}>
              <TextInput
                style={styles.input}
                placeholder="Add a comment..."
                placeholderTextColor={Colors.textMuted}
                value={commentText}
                onChangeText={setCommentText}
                multiline
              />
              <TouchableOpacity
                style={[styles.sendBtn, !commentText.trim() && { opacity: 0.5 }]}
                onPress={handlePostComment}
                disabled={!commentText.trim()}
              >
                <Ionicons name="send" size={24} color={Colors.secondary} />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};


