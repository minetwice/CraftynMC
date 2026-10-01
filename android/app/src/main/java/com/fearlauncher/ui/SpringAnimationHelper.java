package com.fearlauncher.ui;

import android.view.MotionEvent;
import android.view.View;
import androidx.dynamicanimation.animation.DynamicAnimation;
import androidx.dynamicanimation.animation.SpringAnimation;
import androidx.dynamicanimation.animation.SpringForce;

/**
 * Utility helper that injects ultra-fluid, hardware-accelerated physical
 * Spring Animations (scaling up/down on touch interactions) for buttons,
 * card nodes, and lists, establishing the high-end custom Android gamer UI.
 */
public class SpringAnimationHelper {

    public static void bindSpringInteraction(final View view) {
        // Build spring forces
        final SpringAnimation scaleXUp = new SpringAnimation(view, DynamicAnimation.SCALE_X, 1f);
        final SpringAnimation scaleYUp = new SpringAnimation(view, DynamicAnimation.SCALE_Y, 1f);

        final SpringAnimation scaleXDown = new SpringAnimation(view, DynamicAnimation.SCALE_X, 0.94f);
        final SpringAnimation scaleYDown = new SpringAnimation(view, DynamicAnimation.SCALE_Y, 0.94f);

        // Configure Spring configurations for rapid responsiveness with high damping (no sloppy oscillations)
        configureSpringForce(scaleXUp.getSpring());
        configureSpringForce(scaleYUp.getSpring());
        configureSpringForce(scaleXDown.getSpring());
        configureSpringForce(scaleYDown.getSpring());

        view.setOnTouchListener(new View.OnTouchListener() {
            @Override
            public boolean onTouch(View v, MotionEvent event) {
                switch (event.getAction()) {
                    case MotionEvent.ACTION_DOWN:
                        scaleXUp.cancel();
                        scaleYUp.cancel();
                        scaleXDown.start();
                        scaleYDown.start();
                        break;
                    case MotionEvent.ACTION_UP:
                    case MotionEvent.ACTION_CANCEL:
                        scaleXDown.cancel();
                        scaleYDown.cancel();
                        scaleXUp.start();
                        scaleYUp.start();
                        if (event.getAction() == MotionEvent.ACTION_UP) {
                            v.performClick();
                        }
                        break;
                }
                return true;
            }
        });
    }

    private static void configureSpringForce(SpringForce force) {
        if (force != null) {
            force.setDampingRatio(SpringForce.DAMPING_RATIO_LOW_BOUNCY);
            force.setStiffness(SpringForce.STIFFNESS_MEDIUM);
        }
    }
}
