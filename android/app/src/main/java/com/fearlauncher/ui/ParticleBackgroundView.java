package com.fearlauncher.ui;

import android.content.Context;
import android.graphics.Canvas;
import android.graphics.Color;
import android.graphics.Paint;
import android.graphics.SurfaceTexture;
import android.util.AttributeSet;
import android.view.TextureView;
import java.util.ArrayList;
import java.util.List;
import java.util.Random;

/**
 * Highly optimized, battery-friendly ambient parallax particle background.
 * Uses a secondary rendering thread on a TextureView to fully bypass standard
 * Android UI thread / onDraw garbage collection, allowing fear_engine/Mesa GLSL JNI
 * loops to run completely uninhibited.
 */
public class ParticleBackgroundView extends TextureView implements TextureView.SurfaceTextureListener {

    private RenderThread renderThread;
    private final List<Particle> particles = new ArrayList<>();
    private final Random random = new Random();

    public ParticleBackgroundView(Context context) {
        super(context);
        init();
    }

    public ParticleBackgroundView(Context context, AttributeSet attrs) {
        super(context, attrs);
        init();
    }

    public ParticleBackgroundView(Context context, AttributeSet attrs, int defStyleAttr) {
        super(context, attrs, defStyleAttr);
        init();
    }

    private void init() {
        setSurfaceTextureListener(this);
        setOpaque(true);
    }

    @Override
    public void onSurfaceTextureAvailable(SurfaceTexture surface, int width, int height) {
        // Initialize particle coordinate metrics
        particles.clear();
        for (int i = 0; i < 35; i++) {
            particles.add(new Particle(
                    random.nextFloat() * width,
                    random.nextFloat() * height,
                    1.5f + random.nextFloat() * 2.5f,
                    0.2f + random.nextFloat() * 0.6f,
                    120 + random.nextInt(135)
            ));
        }

        renderThread = new RenderThread(surface, width, height);
        renderThread.setRunning(true);
        renderThread.start();
    }

    @Override
    public void onSurfaceTextureSizeChanged(SurfaceTexture surface, int width, int height) {
        if (renderThread != null) {
            renderThread.updateDimensions(width, height);
        }
    }

    @Override
    public boolean onSurfaceTextureDestroyed(SurfaceTexture surface) {
        if (renderThread != null) {
            renderThread.setRunning(false);
            try {
                renderThread.join();
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
            }
            renderThread = null;
        }
        return true;
    }

    @Override
    public void onSurfaceTextureUpdated(SurfaceTexture surface) {
        // Handled internally by RenderThread to minimize overhead
    }

    private class RenderThread extends Thread {
        private final SurfaceTexture surfaceTexture;
        private int width;
        private int height;
        private boolean running = false;
        private final Paint paint;
        private final Paint bgPaint;

        public RenderThread(SurfaceTexture surfaceTexture, int width, int height) {
            this.surfaceTexture = surfaceTexture;
            this.width = width;
            this.height = height;

            paint = new Paint(Paint.ANTI_ALIAS_FLAG);
            paint.setColor(Color.parseColor("#FF2D3F")); // Neon red glow particles

            bgPaint = new Paint();
            bgPaint.setColor(Color.parseColor("#07070A")); // Dark cyber background
        }

        public void setRunning(boolean running) {
            this.running = running;
        }

        public void updateDimensions(int width, int height) {
            synchronized (particles) {
                this.width = width;
                this.height = height;
            }
        }

        @Override
        public void run() {
            while (running) {
                Canvas canvas = null;
                try {
                    // Lock surface canvas
                    canvas = lockCanvas();
                    if (canvas == null) {
                        continue;
                    }

                    // Render cyber background
                    canvas.drawRect(0, 0, width, height, bgPaint);

                    synchronized (particles) {
                        for (Particle p : particles) {
                            // Update particle state
                            p.y -= p.speed;
                            if (p.y < -20) {
                                p.y = height + 20;
                                p.x = random.nextFloat() * width;
                            }

                            // Subtle horizontal wave drift simulation
                            p.x += (float) Math.sin(p.y / 150f) * 0.15f;

                            // Draw ambient glow particle
                            paint.setAlpha(p.alpha);
                            canvas.drawCircle(p.x, p.y, p.radius, paint);
                        }
                    }

                } catch (Exception e) {
                    // Fail silently to safeguard JNI render threads
                } finally {
                    if (canvas != null) {
                        unlockCanvasAndPost(canvas);
                    }
                }

                try {
                    // Optimized framerate throttling to guarantee ~60 FPS with low power usage
                    Thread.sleep(16);
                } catch (InterruptedException e) {
                    Thread.currentThread().interrupt();
                }
            }
        }

        private Canvas lockCanvas() {
            // Internal safety helper for TextureView canvas locking across API versions
            try {
                return ParticleBackgroundView.this.lockCanvas();
            } catch (Exception e) {
                return null;
            }
        }

        private void unlockCanvasAndPost(Canvas canvas) {
            try {
                ParticleBackgroundView.this.unlockCanvasAndPost(canvas);
            } catch (Exception e) {
                // Ignore canvas unlocking failures
            }
        }
    }

    private static class Particle {
        float x;
        float y;
        float radius;
        float speed;
        int alpha;

        Particle(float x, float y, float radius, float speed, int alpha) {
            this.x = x;
            this.y = y;
            this.radius = radius;
            this.speed = speed;
            this.alpha = alpha;
        }
    }
}
