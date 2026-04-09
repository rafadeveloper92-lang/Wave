import { useEffect, useRef } from 'react';
import { Capacitor } from '@capacitor/core';
import { PushNotifications } from '@capacitor/push-notifications';
import { supabase } from '../services/supabaseClient';

/**
 * Regista o token FCM no Supabase (tabela push_tokens) quando corre em Android/iOS nativo.
 * O envio de notificações exige Edge Function ou backend com chave de servidor FCM.
 */
export function usePushRegistration(userId: string | null) {
  const doneRef = useRef(false);

  useEffect(() => {
    if (!userId || !Capacitor.isNativePlatform()) return;

    let cancelled = false;

    const run = async () => {
      try {
        const perm = await PushNotifications.requestPermissions();
        if (perm.receive !== 'granted') return;

        await PushNotifications.addListener('registration', async (token) => {
          if (cancelled || doneRef.current || !token.value) return;
          doneRef.current = true;
          const platform = Capacitor.getPlatform();
          const { error } = await supabase.from('push_tokens').upsert(
            {
              user_id: userId,
              token: token.value,
              platform,
            },
            { onConflict: 'user_id,token' }
          );
          if (error) console.warn('push_tokens upsert', error.message);
        });

        await PushNotifications.addListener('registrationError', (err) => {
          console.warn('Push registration error', err);
        });

        await PushNotifications.register();
      } catch (e) {
        console.warn('usePushRegistration', e);
      }
    };

    void run();

    return () => {
      cancelled = true;
    };
  }, [userId]);
}
