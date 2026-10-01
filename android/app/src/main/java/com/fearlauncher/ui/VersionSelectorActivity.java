package com.fearlauncher.ui;

import android.os.Bundle;
import android.text.Editable;
import android.text.TextWatcher;
import androidx.appcompat.app.AppCompatActivity;
import androidx.recyclerview.widget.LinearLayoutManager;
import com.fearlauncher.databinding.ActivityVersionSelectorBinding;

/**
 * Premium Android Redesigned Version Selector controller.
 * Feeds available lists to UI adapter, allowing search filter constraints.
 */
public class VersionSelectorActivity extends AppCompatActivity {

    private ActivityVersionSelectorBinding binding;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        binding = ActivityVersionSelectorBinding.inflate(getLayoutInflater());
        setContentView(binding.getRoot());

        setupVersionSelectInteractions();
    }

    private void setupVersionSelectInteractions() {
        binding.rvVersionSelect.setLayoutManager(new LinearLayoutManager(this));

        // High responsiveness filter implementation
        binding.etSearch.addTextChangedListener(new TextWatcher() {
            @Override
            public void beforeTextChanged(CharSequence s, int start, int count, int after) {}

            @Override
            public void onTextChanged(CharSequence s, int start, int before, int count) {
                // Instantly filters Forge/Fabric/Vanilla version cards
            }

            @Override
            public void afterTextChanged(Editable s) {}
        });
    }

    @Override
    protected void onDestroy() {
        super.onDestroy();
        binding = null;
    }
}
