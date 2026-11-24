/**
 * Page transition types. The CSS for each lives in app/globals.css
 * ("4. Page transitions"); this file is the typed list used by components
 * and the Motion Lab.
 *
 * When to use which:
 *   fade     switching between bottom-nav tabs (siblings, no direction)
 *   forward  going one level deeper: history list → product
 *   back     coming back up a level (also used for the browser Back button)
 *   rise     opening a task on top: dashboard → scan
 *   zoom     the verdict reveal right after a scan
 *   none     instant (reduced motion is handled in CSS, not here)
 */
export const TRANSITIONS = ["fade", "forward", "back", "rise", "zoom", "none"] as const;
export type TransitionType = (typeof TRANSITIONS)[number];

export const TRANSITION_INFO: Record<TransitionType, { name: string; when: string; duration: string }> = {
  fade: { name: "تلاشي", when: "التنقل بين تبويبات الشريط السفلي", duration: "150ms" },
  forward: { name: "تقدّم", when: "الدخول إلى تفاصيل: من السجل إلى منتج", duration: "200ms" },
  back: { name: "رجوع", when: "العودة للخلف، وزر الرجوع في المتصفح", duration: "200ms" },
  rise: { name: "صعود", when: "فتح مهمة فوق الصفحة: من الرئيسية إلى الفحص", duration: "200ms" },
  zoom: { name: "تكبير", when: "كشف النتيجة بعد الفحص", duration: "300ms" },
  none: { name: "بدون", when: "انتقال فوري", duration: "0ms" },
};
