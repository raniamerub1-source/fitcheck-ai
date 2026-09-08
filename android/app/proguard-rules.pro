# Proguard rules for FitCheck AI Trusted Web Activity

-keep class com.google.androidbrowserhelper.** { *; }
-keep interface com.google.androidbrowserhelper.** { *; }

-keep class androidx.browser.customtabs.** { *; }
-keep interface androidx.browser.customtabs.** { *; }

-dontwarn com.google.androidbrowserhelper.**
-dontwarn androidx.browser.**
