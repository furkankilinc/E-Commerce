import { useState, useRef } from 'react';
import { useToast } from '../../../shared/components/Toast';
import { apiClient } from '../../../shared/api/apiClient';

export const useReviewForm = (item: any, onSuccess: () => void) => {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const toast = useToast();
    const [rating, setRating] = useState(5);
    const [title, setTitle] = useState('');
    const [comment, setComment] = useState('');
    const [images, setImages] = useState<string[]>([]);
    const [uploading, setUploading] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;

        setUploading(true);
        try {
            const formData = new FormData();
            Array.from(files).forEach(file => formData.append('images', file));

            const res = await fetch('http://localhost:5173/api/upload/bulk', {
                method: 'POST',
                body: formData
            });

            const data = await res.json();
            if (data.urls) {
                setImages([...images, ...data.urls]);
                toast.success(`${data.urls.length} görsel yüklendi.`);
            } else {
                toast.error(data.message || 'Görsel yüklenemedi.');
            }
        } catch (err) {
            toast.error('Görsel yüklenirken hata oluştu.');
        } finally {
            setUploading(false);
        }
    };

    const removeImage = (index: number) => {
        setImages(images.filter((_, i) => i !== index));
    };

    const handleSubmit = async () => {
        if (!title || !comment) {
            toast.warning('Lütfen başlık ve yorum alanlarını doldurun.');
            return;
        }

        setSubmitting(true);
        try {
            const res = await apiClient('/api/reviews', {
                method: 'POST',
                body: JSON.stringify({
                    productId: item.productId,
                    rating,
                    title,
                    comment,
                    images
                })
            });
            const data = await res.json();
            if (data.success) {
                toast.success('Yorumunuz başarıyla yayınlandı!');
                onSuccess();
            } else {
                toast.error(data.message || 'Hata oluştu.');
            }
        } catch (err) {
            toast.error('Giriş yapmanız veya ürünü satın almış olmanız gerekiyor.');
        } finally {
            setSubmitting(false);
        }
    };

    return {
        fileInputRef,
        rating,
        setRating,
        title,
        setTitle,
        comment,
        setComment,
        images,
        uploading,
        submitting,
        handleFileUpload,
        removeImage,
        handleSubmit
    };
};
