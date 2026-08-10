-- 086: developer-unit communities become public-readable open boards.
-- Membership/join rows remain available for optional community features, but
-- approved membership is no longer a gate for posting or replying.

BEGIN;

ALTER TABLE public.developer_communities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_replies ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.set_community_post_author_role()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.author_role := CASE
    WHEN EXISTS (
      SELECT 1
      FROM public.developer_communities dc
      WHERE dc.id = NEW.community_id
        AND dc.owner_id = NEW.author_id
    ) THEN 'developer'
    ELSE 'player'
  END;
  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.set_community_post_author_role() FROM PUBLIC;

DROP TRIGGER IF EXISTS community_posts_set_author_role
  ON public.community_posts;
CREATE TRIGGER community_posts_set_author_role
  BEFORE INSERT ON public.community_posts
  FOR EACH ROW
  EXECUTE FUNCTION public.set_community_post_author_role();

DROP POLICY IF EXISTS "Communities are publicly readable"
  ON public.developer_communities;
CREATE POLICY "Communities are publicly readable"
  ON public.developer_communities
  FOR SELECT
  TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS "Community posts readable by approved members"
  ON public.community_posts;
DROP POLICY IF EXISTS "Community posts are publicly readable"
  ON public.community_posts;
CREATE POLICY "Community posts are publicly readable"
  ON public.community_posts
  FOR SELECT
  TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS "Community owners insert posts"
  ON public.community_posts;
DROP POLICY IF EXISTS "Registered users insert community posts"
  ON public.community_posts;
CREATE POLICY "Registered users insert community posts"
  ON public.community_posts
  FOR INSERT
  TO authenticated
  WITH CHECK (
    public.auth_is_registered_user()
    AND author_id = auth.uid()
  );

DROP POLICY IF EXISTS "Authors or community owners delete posts"
  ON public.community_posts;
CREATE POLICY "Authors or community owners delete posts"
  ON public.community_posts
  FOR DELETE
  TO authenticated
  USING (
    public.auth_is_registered_user()
    AND (
      author_id = auth.uid()
      OR EXISTS (
        SELECT 1
        FROM public.developer_communities dc
        WHERE dc.id = community_posts.community_id
          AND dc.owner_id = auth.uid()
      )
    )
  );

DROP POLICY IF EXISTS "Community replies readable with post access"
  ON public.community_replies;
DROP POLICY IF EXISTS "Community replies are publicly readable"
  ON public.community_replies;
CREATE POLICY "Community replies are publicly readable"
  ON public.community_replies
  FOR SELECT
  TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS "Approved members insert replies"
  ON public.community_replies;
DROP POLICY IF EXISTS "Registered users insert community replies"
  ON public.community_replies;
CREATE POLICY "Registered users insert community replies"
  ON public.community_replies
  FOR INSERT
  TO authenticated
  WITH CHECK (
    public.auth_is_registered_user()
    AND author_id = auth.uid()
  );

DROP POLICY IF EXISTS "Authors or community owners delete replies"
  ON public.community_replies;
CREATE POLICY "Authors or community owners delete replies"
  ON public.community_replies
  FOR DELETE
  TO authenticated
  USING (
    public.auth_is_registered_user()
    AND (
      author_id = auth.uid()
      OR EXISTS (
        SELECT 1
        FROM public.community_posts cp
        INNER JOIN public.developer_communities dc
          ON dc.id = cp.community_id
        WHERE cp.id = community_replies.post_id
          AND dc.owner_id = auth.uid()
      )
    )
  );

COMMENT ON TABLE public.community_memberships IS
  'Optional community membership/join state. It is not a post or reply authorization gate.';
COMMENT ON COLUMN public.community_posts.author_role IS
  'developer | player. A BEFORE INSERT trigger derives this from community ownership and ignores client input.';

GRANT SELECT ON TABLE public.developer_communities TO anon, authenticated;
GRANT SELECT ON TABLE public.community_posts TO anon, authenticated;
GRANT SELECT ON TABLE public.community_replies TO anon, authenticated;
GRANT INSERT, DELETE ON TABLE public.community_posts TO authenticated;
GRANT INSERT, DELETE ON TABLE public.community_replies TO authenticated;

COMMIT;
