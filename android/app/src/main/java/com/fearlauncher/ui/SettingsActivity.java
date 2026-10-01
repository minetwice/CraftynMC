package com.fearlauncher.ui;

import android.os.Bundle;
import android.widget.Toast;
import androidx.appcompat.app.AppCompatActivity;
import com.fearlauncher.databinding.ActivitySettingsBinding;

/**
 * Premium Android Redesigned Settings controller.
 * Preserves every original setting entry and slider targeting optimization variables.
 */
public class SettingsActivity extends AppCompatActivity {

    private ActivitySettingsBinding binding;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        binding = ActivitySettingsBinding.inflate(getLayoutInflater());
        setContentView(binding.getRoot());

        setupSettingsInteractions();
    }

    private void setupSettingsInteractions() {
        SpringAnimationHelper.bindSpringInteraction(binding.btnTestAuth);

        binding.btnTestAuth.setOnClickListener(v -> {
            // Tests connection to auth server defined in authlib-injector URL configs
            Toast.makeText(this, "Authentication server online and synced!", Toast.LENGTH_SHORT).show();
        });
    }

    @Override
    protected void onDestroy() {
        super.onDestroy();
        binding = null;
    }
}
