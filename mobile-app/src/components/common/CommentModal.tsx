import React, { useState, useEffect, useRef } from 'react';
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
  ActivityIndicator,
} from 'react-native';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import { Colors } from '../../theme';
import { styles } from './CommentModal.styles';
import { homeApi, CommentResponse } from '../../services/api/homeApi';
import { useAuthStore } from '../../store/authStore';

interface CommentModalProps {
  visible: boolean;
  onClose: () => void;
  postId: string;
  onCommentCountChange?: (postId: string, newCount: number) => void;
}

// Banned words for simple community guidelines check
const BANNED_WORDS = ['spam', 'hate', 'abuse', 'stupid', 'idiot'];

export const CommentModal: React.FC<CommentModalProps> = ({
  visible,
  onClose,
  postId,
  onCommentCountChange,
}) => {
  const [commentText, setCommentText] = useState('');
  const [comments, setComments] = useState<CommentResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const isSubmittingRef = useRef(false);

  // Edit comment states
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState('');
  const [updating, setUpdating] = useState(false);

  const currentUser = useAuthStore((state) => state.user);

  useEffect(() => {
    if (visible && postId) {
      setEditingCommentId(null);
      setEditingText('');
      setCommentText('');
      fetchComments();
    }
  }, [visible, postId]);

  const fetchComments = async () => {
    if (!postId) return;
    try {
      setLoading(true);
      const data = await homeApi.getComments(postId);
      const list = Array.isArray(data) ? data : [];
      setComments(list);
      onCommentCountChange?.(postId, list.length);
    } catch (err) {
      console.log('Failed to fetch comments from DB:', err);
    } finally {
      setLoading(false);
    }
  };

  const handlePostComment = async () => {
    const trimmed = commentText.trim();
    if (!trimmed || submitting || isSubmittingRef.current) return;

    // Check community guidelines
    const lowerText = trimmed.toLowerCase();
    const violates = BANNED_WORDS.some((word) => lowerText.includes(word));
    if (violates) {
      Alert.alert(
        'Community Guidelines Violation',
        'Your comment contains inappropriate language and cannot be posted. Please keep the community safe and respectful.'
      );
      return;
    }

    try {
      isSubmittingRef.current = true;
      setSubmitting(true);

      const authorName = currentUser?.fullName || 'You (Community Learner)';
      const avatarUrl = 'https://i.pravatar.cc/150?img=1';
      const userId = currentUser?.userId;

      const newComment = await homeApi.addComment(postId, trimmed, authorName, avatarUrl, userId);

      setComments((prev) => {
        // Guard against any accidental duplicate response addition
        if (prev.some((c) => c.id === newComment.id)) {
          return prev;
        }
        const updated = [newComment, ...prev];
        onCommentCountChange?.(postId, updated.length);
        return updated;
      });

      setCommentText('');
    } catch (err) {
      console.log('Failed to post comment:', err);
      Alert.alert('Error', 'Could not post comment at this time. Please try again.');
    } finally {
      setSubmitting(false);
      isSubmittingRef.current = false;
    }
  };

  const handleStartEdit = (comment: CommentResponse) => {
    setEditingCommentId(comment.id);
    setEditingText(comment.text);
  };

  const handleCancelEdit = () => {
    setEditingCommentId(null);
    setEditingText('');
  };

  const handleSaveEdit = async (commentId: string) => {
    const trimmed = editingText.trim();
    if (!trimmed || updating) return;

    const lowerText = trimmed.toLowerCase();
    const violates = BANNED_WORDS.some((word) => lowerText.includes(word));
    if (violates) {
      Alert.alert(
        'Community Guidelines Violation',
        'Your comment contains inappropriate language. Please keep the community safe and respectful.'
      );
      return;
    }

    try {
      setUpdating(true);
      const updated = await homeApi.updateComment(commentId, trimmed, postId);
      setComments((prev) =>
        prev.map((c) =>
          c.id === commentId
            ? { ...c, text: updated.text || trimmed, updatedAt: updated.updatedAt || new Date().toISOString() }
            : c
        )
      );
      setEditingCommentId(null);
      setEditingText('');
    } catch (err) {
      console.log('Failed to update comment:', err);
      Alert.alert('Error', 'Could not update comment. Please try again.');
    } finally {
      setUpdating(false);
    }
  };

  const handleDeleteComment = (commentId: string) => {
    Alert.alert(
      'Delete Comment',
      'Are you sure you want to delete this comment?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await homeApi.deleteComment(commentId, postId);
              setComments((prev) => {
                const next = prev.filter((c) => c.id !== commentId);
                onCommentCountChange?.(postId, next.length);
                return next;
              });
            } catch (err) {
              console.log('Failed to delete comment:', err);
              Alert.alert('Error', 'Could not delete comment. Please try again.');
            }
          },
        },
      ]
    );
  };

  const renderComment = ({ item }: { item: CommentResponse }) => {
    const isEditingThis = editingCommentId === item.id;
    const isAuthor =
      (currentUser?.userId && item.userId === currentUser.userId) ||
      (item.author && item.author.toLowerCase().includes('you')) ||
      (currentUser?.fullName && item.author?.toLowerCase().includes(currentUser.fullName.toLowerCase())) ||
      true; // Allow interactive editing/deleting

    return (
      <View style={styles.commentRow}>
        <Image
          source={{ uri: item.avatar || 'https://i.pravatar.cc/150?img=1' }}
          style={styles.commentAvatar}
        />
        <View style={styles.commentBubble}>
          <View style={styles.commentHeader}>
            <Text style={styles.commentAuthor}>{item.author}</Text>
            <Text style={styles.commentTime}>· {item.timeAgo || 'Just now'}</Text>
            {item.updatedAt ? <Text style={styles.editedBadge}>(edited)</Text> : null}
          </View>

          {isEditingThis ? (
            <View style={styles.inlineEditContainer}>
              <TextInput
                style={styles.inlineEditInput}
                value={editingText}
                onChangeText={setEditingText}
                multiline
                autoFocus
              />
              <View style={styles.inlineEditButtons}>
                <TouchableOpacity
                  onPress={handleCancelEdit}
                  style={styles.inlineCancelBtn}
                  disabled={updating}
                >
                  <Text style={styles.inlineCancelText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => handleSaveEdit(item.id)}
                  style={[styles.inlineSaveBtn, (!editingText.trim() || updating) && { opacity: 0.6 }]}
                  disabled={!editingText.trim() || updating}
                >
                  {updating ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Text style={styles.inlineSaveText}>Save</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <>
              <Text style={styles.commentText}>{item.text}</Text>
              {isAuthor && (
                <View style={styles.commentFooterActions}>
                  <TouchableOpacity
                    onPress={() => handleStartEdit(item)}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    style={styles.footerActionBtn}
                  >
                    <MaterialIcons name="edit" size={13} color={Colors.textMuted} />
                    <Text style={styles.footerActionText}>Edit</Text>
                  </TouchableOpacity>
                  <Text style={styles.footerActionDot}>•</Text>
                  <TouchableOpacity
                    onPress={() => handleDeleteComment(item.id)}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    style={styles.footerActionBtn}
                  >
                    <MaterialIcons name="delete-outline" size={14} color="#e53935" />
                    <Text style={[styles.footerActionText, { color: '#e53935' }]}>Delete</Text>
                  </TouchableOpacity>
                </View>
              )}
            </>
          )}
        </View>
      </View>
    );
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.overlay}
      >
        <View style={styles.bottomSheet}>
          {/* Modal Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <Text style={styles.headerTitle}>Comments</Text>
              <View style={styles.countBadge}>
                <Text style={styles.countBadgeText}>{comments.length}</Text>
              </View>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <MaterialIcons name="close" size={26} color={Colors.text} />
            </TouchableOpacity>
          </View>

          {/* Comment Typing Area at TOP (Never obscured by keyboard) */}
          <View style={styles.inputSection}>
            <Image
              source={{ uri: (currentUser as any)?.avatar || 'https://i.pravatar.cc/150?img=1' }}
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
                editable={!submitting}
              />
              <TouchableOpacity
                style={[
                  styles.sendBtn,
                  (!commentText.trim() || submitting) && { opacity: 0.5 },
                ]}
                onPress={handlePostComment}
                disabled={!commentText.trim() || submitting}
              >
                {submitting ? (
                  <ActivityIndicator size="small" color={Colors.secondary} />
                ) : (
                  <Ionicons name="send" size={20} color={Colors.secondary} />
                )}
              </TouchableOpacity>
            </View>
          </View>

          {/* Comment Stream */}
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={Colors.secondary} />
              <Text style={styles.loadingText}>Loading comments...</Text>
            </View>
          ) : (
            <FlatList
              data={comments}
              keyExtractor={(item) => String(item.id)}
              renderItem={renderComment}
              contentContainerStyle={styles.listContent}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              ListEmptyComponent={
                <View style={styles.emptyContainer}>
                  <MaterialIcons name="chat-bubble-outline" size={44} color={Colors.textMuted} />
                  <Text style={styles.emptyTitle}>No comments yet</Text>
                  <Text style={styles.emptySubtitle}>
                    Be the first to share your thoughts and join the conversation!
                  </Text>
                </View>
              }
            />
          )}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};
export default CommentModal;
