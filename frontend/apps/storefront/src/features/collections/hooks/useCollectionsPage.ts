import { useState } from 'react';
import { useAuth } from '../../auth/useAuth';
import { useParams } from 'react-router-dom';
import { useCollections } from '../store/collections.store';
import { useToast } from '../../../shared/components/Toast';

export const useCollectionsPage = () => {
    const { isAuthenticated } = useAuth();
    const { collectionId } = useParams<{ collectionId?: string }>();
    const { collections, create } = useCollections();
    const toast = useToast();
    
    const [isCreating, setIsCreating] = useState(false);
    const [newName, setNewName] = useState('');
    const [selectedEmoji, setSelectedEmoji] = useState('📦');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleCreate = async () => {
        if (!newName.trim()) return;
        setIsSubmitting(true);
        await create(newName.trim(), selectedEmoji);
        toast.success(`"${newName}" koleksiyonu oluşturuldu!`);
        setNewName('');
        setIsCreating(false);
        setIsSubmitting(false);
    };

    return {
        isAuthenticated,
        collectionId,
        collections,
        isCreating,
        setIsCreating,
        newName,
        setNewName,
        selectedEmoji,
        setSelectedEmoji,
        isSubmitting,
        handleCreate
    };
};
