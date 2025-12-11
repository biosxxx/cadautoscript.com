import React, {useEffect, useRef, useState} from 'react';
import EmojiPicker, {type CustomEmoji, type EmojiClickData} from 'emoji-picker-react';
import {supabase} from '@site/src/lib/supabaseClient';
import styles from './Comments.module.css';

type Props = {
  onEmojiSelect: (emojiCode: string) => void;
};

export default function EmojiPickerBtn({onEmojiSelect}: Props): JSX.Element {
  const [customEmojis, setCustomEmojis] = useState<CustomEmoji[]>([]);
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    let active = true;
    const load = async () => {
      const {data, error} = await supabase.from('custom_emojis').select('name, url');
      if (!active) return;
      if (error) {
        console.error('[Comments] Unable to fetch custom emojis', error.message);
        return;
      }
      const mapped: CustomEmoji[] =
        data?.map((row) => ({
          names: [row.name],
          id: `custom-${row.name}`,
          imgUrl: row.url,
        })) ?? [];
      setCustomEmojis(mapped);
    };
    void load();
    return () => {
      active = false;
    };
  }, []);

  const handleEmoji = (emojiData: EmojiClickData) => {
    if (emojiData.isCustom) {
      const customHtml = `<img src="${emojiData.imageUrl}" alt="${emojiData.names?.[0] ?? 'emoji'}" width="24" height="24" class="custom-emoji" />`;
      onEmojiSelect(customHtml);
    } else {
      onEmojiSelect(emojiData.emoji);
    }
    setOpen(false);
  };

  useEffect(() => {
    if (!open) return;
    const handleClickAway = (event: MouseEvent) => {
      const target = event.target as Node | null;
      if (wrapperRef.current && target && !wrapperRef.current.contains(target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickAway);
    return () => document.removeEventListener('mousedown', handleClickAway);
  }, [open]);

  return (
    <div className={styles.pickerWrapper} ref={wrapperRef}>
      <button
        type="button"
        className={styles.pickerButton}
        onClick={() => setOpen((value) => !value)}
        aria-label="Insert emoji"
      >
        😊
      </button>
      {open ? (
        <div className={styles.pickerPopover}>
          <EmojiPicker
            onEmojiClick={handleEmoji}
            lazyLoadEmojis
            previewConfig={{showPreview: false}}
            searchDisabled
            skinTonesDisabled
            customEmojis={customEmojis}
            height={320}
            width="100%"
          />
        </div>
      ) : null}
    </div>
  );
}
