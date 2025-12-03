import {createClient} from '@supabase/supabase-js';
import siteConfig from '@generated/docusaurus.config';

const {SUPABASE_URL, SUPABASE_ANON_KEY} = siteConfig.customFields as {
  SUPABASE_URL?: string;
  SUPABASE_ANON_KEY?: string;
};

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  throw new Error('Supabase environment variables are not configured.');
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
