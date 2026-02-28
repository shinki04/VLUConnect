-- Create a function to handle comment likes
CREATE OR REPLACE FUNCTION public.handle_new_comment_like()
RETURNS TRIGGER AS $$
DECLARE
  v_comment_author_id UUID;
  v_post_id UUID;
BEGIN
  -- Get the author of the comment and the associated post
  SELECT user_id, post_id INTO v_comment_author_id, v_post_id
  FROM public.post_comments
  WHERE id = NEW.comment_id;

  -- Only create a notification if the liker is not the comment author
  IF v_comment_author_id != NEW.user_id THEN
    INSERT INTO public.notifications (
      recipient_id,
      sender_id,
      type,
      entity_type,
      entity_id,
      title,
      message,
      metadata
    ) VALUES (
      v_comment_author_id,
      NEW.user_id,
      'like', -- Use generic like or you can define like_comment in your app if you prefer, reusing existing enum is safer
      'comment',
      NEW.comment_id,
      'Thích bình luận',
      'đã thích bình luận của bạn.',
      jsonb_build_object('post_id', v_post_id, 'comment_id', NEW.comment_id)
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create the trigger on comment_likes
DROP TRIGGER IF EXISTS on_comment_like_created ON public.comment_likes;
CREATE TRIGGER on_comment_like_created
  AFTER INSERT ON public.comment_likes
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_comment_like();
