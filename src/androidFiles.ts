export interface AndroidFile {
  name: string;
  path: string;
  category: "Gradle" | "Manifest" | "Resources" | "Layouts" | "Kotlin Arch";
  content: string;
}

export const ANDROID_PROJECT_FILES: AndroidFile[] = [
  {
    name: "settings.gradle.kts",
    path: "/android/settings.gradle.kts",
    category: "Gradle",
    content: `pluginManagement {
    repositories {
        google()
        mavenCentral()
        gradlePluginPortal()
    }
}
dependencyResolutionManagement {
    repositoriesMode.set(RepositoriesMode.FAIL_ON_PROJECT_REPOS)
    repositories {
        google()
        mavenCentral()
    }
}

rootProject.name = "PharmaNews"
include(":app")`
  },
  {
    name: "build.gradle.kts (Project)",
    path: "/android/build.gradle.kts",
    category: "Gradle",
    content: `// Top-level build file where you can add configuration options common to all sub-projects/modules.
plugins {
    alias(libs.plugins.android.application) apply false
    alias(libs.plugins.kotlin.android) apply false
    alias(libs.plugins.kotlin.kapt) apply false
    alias(libs.plugins.hilt.android) apply false
    alias(libs.plugins.navigation.safeargs) apply false
}`
  },
  {
    name: "build.gradle.kts (App)",
    path: "/android/app/build.gradle.kts",
    category: "Gradle",
    content: `plugins {
    id("com.android.application")
    id("kotlin-android")
    id("kotlin-kapt")
    id("dagger.hilt.android.plugin")
    id("androidx.navigation.safeargs.kotlin")
}

android {
    namespace = "com.pharmanews.app"
    compileSdk = 34

    defaultConfig {
        applicationId = "com.pharmanews.app"
        minSdk = 26
        targetSdk = 34
        versionCode = 1
        versionName = "1.0.0"

        testInstrumentationRunner = "androidx.test.runner.AndroidJUnitRunner"
        vectorDrawables {
            useSupportLibrary = true
        }
    }

    buildTypes {
        release {
            isMinifyEnabled = true
            proguardFiles(
                getDefaultProguardFile("proguard-android-optimize.txt"),
                "proguard-rules.pro"
            )
        }
    }
    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }
    kotlinOptions {
        jvmTarget = "17"
    }
    buildFeatures {
        viewBinding = true
        dataBinding = true
    }
}

dependencies {
    // Core Android libraries
    implementation("androidx.core:core-ktx:1.12.0")
    implementation("androidx.appcompat:appcompat:1.6.1")
    implementation("com.google.android.material:material:1.11.0")
    implementation("androidx.constraintlayout:constraintlayout:2.1.4")
    implementation("androidx.recyclerview:recyclerview:1.3.2")
    implementation("androidx.swiperefreshlayout:swiperefreshlayout:1.1.0")

    // Navigation Activity/Fragment ktx
    implementation("androidx.navigation:navigation-fragment-ktx:2.7.7")
    implementation("androidx.navigation:navigation-ui-ktx:2.7.7")

    // Lifecycles & Flow
    implementation("androidx.lifecycle:lifecycle-viewmodel-ktx:2.7.0")
    implementation("androidx.lifecycle:lifecycle-livedata-ktx:2.7.0")
    implementation("androidx.lifecycle:lifecycle-runtime-ktx:2.7.0")

    // Hilt Dependency Injection
    implementation("com.google.dagger:hilt-android:2.50")
    kapt("com.google.dagger:hilt-android-compiler:2.50")

    // Room Persistent Database
    implementation("androidx.room:room-runtime:2.6.1")
    implementation("androidx.room:room-ktx:2.6.1")
    kapt("androidx.room:room-compiler:2.6.1")

    // Retrofit + OkHttp Networking
    implementation("com.squareup.retrofit2:retrofit:2.9.0")
    implementation("com.squareup.retrofit2:converter-moshi:2.9.0")
    implementation("com.squareup.okhttp3:okhttp:4.12.0")
    implementation("com.squareup.okhttp3:logging-interceptor:4.12.0")

    // Moshi JSON Parser
    implementation("com.squareup.moshi:moshi-kotlin:1.15.0")
    kapt("com.squareup.moshi:moshi-kotlin-codegen:1.15.0")

    // Image loading with Coil
    implementation("io.coil-kt:coil:2.5.0")

    // Preferences DataStore
    implementation("androidx.datastore:datastore-preferences:1.0.0")

    // Shimmer effect loading loaders
    implementation("com.facebook.shimmer:shimmer:0.5.0")

    // Firebase Cloud Messaging
    implementation("com.google.firebase:firebase-messaging-ktx:23.4.1")

    // Local/Unit and UI Testing
    testImplementation("junit:junit:4.13.2")
    androidTestImplementation("androidx.test.ext:junit:1.1.5")
    androidTestImplementation("androidx.test.espresso:espresso-core:3.5.1")
}`
  },
  {
    name: "AndroidManifest.xml",
    path: "/android/app/src/main/AndroidManifest.xml",
    category: "Manifest",
    content: `<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android"
    package="com.pharmanews.app">

    <!-- Permissions required for networking and caching -->
    <uses-permission android:name="android.permission.INTERNET" />
    <uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />
    <uses-permission android:name="android.permission.POST_NOTIFICATIONS" />

    <application
        android:name=".PharmaNewsApplication"
        android:allowBackup="true"
        android:icon="@mipmap/ic_launcher"
        android:label="@string/app_name"
        android:roundIcon="@mipmap/ic_launcher_round"
        android:supportsRtl="true"
        android:theme="@style/Theme.PharmaNews"
        android:usesCleartextTraffic="true">

        <!-- Entry Activity -->
        <activity
            android:name=".presentation.MainActivity"
            android:exported="true"
            android:theme="@style/Theme.PharmaNews">
            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>
        </activity>

        <!-- Firebase Cloud Messaging Service -->
        <service
            android:name=".service.PharmaNewsFcmService"
            android:exported="false">
            <intent-filter>
                <action android:name="com.google.firebase.MESSAGING_EVENT" />
            </intent-filter>
        </service>

    </application>

</manifest>`
  },
  {
    name: "colors.xml",
    path: "/android/app/src/main/res/values/colors.xml",
    category: "Resources",
    content: `<?xml version="1.0" encoding="utf-8"?>
<resources>
    <!-- Professional Pharmaceutical Theme Colors -->
    <color name="primaryColor">#1565C0</color> <!-- Pharma Deep Blue -->
    <color name="primaryLightColor">#5e92f3</color>
    <color name="primaryDarkColor">#003c8f</color>
    
    <color name="secondaryColor">#00ACC1</color> <!-- Clinical Teal -->
    <color name="secondaryLightColor">#5ddef4</color>
    <color name="secondaryDarkColor">#007c91</color>
    
    <color name="accentColor">#43A047</color> <!-- Active Green -->
    
    <!-- Neutral Colors -->
    <color name="backgroundColor">#FAFAFA</color>
    <color name="surfaceColor">#FFFFFF</color>
    <color name="textPrimary">#212121</color>
    <color name="textSecondary">#757575</color>
    <color name="dividerColor">#E0E0E0</color>

    <color name="shimmer_base">#E0E0E0</color>
    <color name="shimmer_highlight">#F5F5F5</color>
</resources>`
  },
  {
    name: "strings.xml",
    path: "/android/app/src/main/res/values/strings.xml",
    category: "Resources",
    content: `<?xml version="1.0" encoding="utf-8"?>
<resources>
    <string name="app_name">PharmaNews</string>
    <string name="title_breaking_news">Breaking News</string>
    <string name="title_latest_updates">Latest Pharmaceutical Updates</string>
    <string name="search_hint">Search drugs, companies, protocols, trials...</string>
    <string name="menu_home">Home</string>
    <string name="menu_search">Search</string>
    <string name="menu_bookmarks">Saved</string>
    <string name="menu_settings">Settings</string>
    
    <!-- Settings section strings -->
    <string name="settings_header_preferences">Preferences</string>
    <string name="settings_title_theme">App Theme</string>
    <string name="settings_desc_theme">Switch between Light, Dark, or System mode</string>
    <string name="settings_title_notifications">Push Notifications</string>
    <string name="settings_desc_notifications">Notify on regulatory approvals & breakthroughs</string>
    <string name="settings_title_cache_size">Article Cache Size</string>
    <string name="settings_desc_cache_size">Configure space held for offline storage (default 50MB)</string>
    <string name="settings_title_auto_refresh">Auto Refresh Interval</string>
    <string name="settings_desc_auto_refresh">Choose how often to sync articles in background</string>
    <string name="settings_title_about">About PharmaNews</string>
    <string name="settings_desc_about">Version 1.0.0 (Build 2026). Trusted aggregator for medicine experts.</string>
    <string name="action_read_full">Read Original Article</string>
    <string name="action_bookmark">Save Article</string>
    <string name="action_share">Share Article</string>
    <string name="no_bookmarks_yet">No Saved Bookmarks</string>
    <string name="no_bookmarks_desc">Articles you bookmark will be saved locally for offline medical reference.</string>
    <string name="no_results_found">No Matches Found</string>
    <string name="error_network">No Internet Connection</string>
    <string name="error_network_desc">Displaying cached offline content. Please check your network to refresh.</string>
</resources>`
  },
  {
    name: "themes.xml",
    path: "/android/app/src/main/res/values/themes.xml",
    category: "Resources",
    content: `<?xml version="1.0" encoding="utf-8"?>
<resources xmlns:tools="http://schemas.android.com/tools">
    <!-- Base application theme. -->
    <style name="Theme.PharmaNews" parent="Theme.Material3.DayNight.NoActionBar">
        <!-- Primary brand color. -->
        <item name="colorPrimary">@color/primaryColor</item>
        <item name="colorOnPrimary">@color/surfaceColor</item>
        <!-- Secondary brand color. -->
        <item name="colorSecondary">@color/secondaryColor</item>
        <item name="colorOnSecondary">@color/surfaceColor</item>
        <!-- Status bar color. -->
        <item name="android:statusBarColor">@color/primaryDarkColor</item>
        <!-- Customize your light theme here. -->
        <item name="android:windowBackground">@color/backgroundColor</item>
    </style>
</resources>`
  },
  {
    name: "bottom_nav_menu.xml",
    path: "/android/app/src/main/res/menu/bottom_nav_menu.xml",
    category: "Layouts",
    content: `<?xml version="1.0" encoding="utf-8"?>
<menu xmlns:android="http://schemas.android.com/apk/res/android">
    <item
        android:id="@+id/navigation_home"
        android:icon="@android:drawable/ic_menu_today"
        android:title="@string/menu_home" />
    <item
        android:id="@+id/navigation_search"
        android:icon="@android:drawable/ic_menu_search"
        android:title="@string/menu_search" />
    <item
        android:id="@+id/navigation_bookmarks"
        android:icon="@android:drawable/ic_menu_save"
        android:title="@string/menu_bookmarks" />
    <item
        android:id="@+id/navigation_settings"
        android:icon="@android:drawable/ic_menu_preferences"
        android:title="@string/menu_settings" />
</menu>`
  },
  {
    name: "nav_graph.xml",
    path: "/android/app/src/main/res/navigation/nav_graph.xml",
    category: "Layouts",
    content: `<?xml version="1.0" encoding="utf-8"?>
<navigation xmlns:android="http://schemas.android.com/apk/res/android"
    xmlns:app="http://schemas.android.com/apk/res-auto"
    xmlns:tools="http://schemas.android.com/tools"
    android:id="@+id/nav_graph"
    app:startDestination="@id/navigation_home">

    <fragment
        android:id="@+id/navigation_home"
        android:name="com.pharmanews.app.presentation.home.HomeFragment"
        android:label="Home"
        tools:layout="@layout/fragment_home">
        <action
            android:id="@+id/action_home_to_detail"
            app:destination="@id/navigation_article_detail" />
    </fragment>

    <fragment
        android:id="@+id/navigation_search"
        android:name="com.pharmanews.app.presentation.search.SearchFragment"
        android:label="Search"
        tools:layout="@layout/fragment_search">
        <action
            android:id="@+id/action_search_to_detail"
            app:destination="@id/navigation_article_detail" />
    </fragment>

    <fragment
        android:id="@+id/navigation_bookmarks"
        android:name="com.pharmanews.app.presentation.bookmarks.BookmarksFragment"
        android:label="Bookmarks"
        tools:layout="@layout/fragment_bookmarks">
        <action
            android:id="@+id/action_bookmarks_to_detail"
            app:destination="@id/navigation_article_detail" />
    </fragment>

    <fragment
        android:id="@+id/navigation_settings"
        android:name="com.pharmanews.app.presentation.settings.SettingsFragment"
        android:label="Settings"
        tools:layout="@layout/fragment_settings" />

    <fragment
        android:id="@+id/navigation_article_detail"
        android:name="com.pharmanews.app.presentation.detail.ArticleDetailFragment"
        android:label="Article Detail"
        tools:layout="@layout/fragment_article_detail">
        <argument
            android:name="articleId"
            app:argType="string" />
    </fragment>

</navigation>`
  },
  {
    name: "fragment_home.xml",
    path: "/android/app/src/main/res/layout/fragment_home.xml",
    category: "Layouts",
    content: `<?xml version="1.0" encoding="utf-8"?>
<androidx.constraintlayout.widget.ConstraintLayout xmlns:android="http://schemas.android.com/apk/res/android"
    xmlns:app="http://schemas.android.com/apk/res-auto"
    xmlns:tools="http://schemas.android.com/tools"
    android:layout_width="match_parent"
    android:layout_height="match_parent"
    tools:context=".presentation.home.HomeFragment">

    <!-- Top App Bar / Header -->
    <com.google.android.material.appbar.AppBarLayout
        android:id="@+id/app_bar"
        android:layout_width="0dp"
        android:layout_height="wrap_content"
        app:layout_constraintEnd_toEndOf="parent"
        app:layout_constraintStart_toStartOf="parent"
        app:layout_constraintTop_toTopOf="parent">

        <com.google.android.material.appbar.MaterialToolbar
            android:id="@+id/toolbar"
            android:layout_width="match_parent"
            android:layout_height="?attr/actionBarSize"
            android:background="?attr/colorPrimary"
            app:title="PharmaNews"
            app:titleTextColor="@color/surfaceColor" />

        <!-- Category Tabs -->
        <com.google.android.material.tabs.TabLayout
            android:id="@+id/category_tabs"
            android:layout_width="match_parent"
            android:layout_height="48dp"
            android:background="?attr/colorPrimary"
            app:tabGravity="fill"
            app:tabIndicatorColor="@color/secondaryLightColor"
            app:tabMode="scrollable"
            app:tabSelectedTextColor="@color/surfaceColor"
            app:tabTextColor="#B3FFFFFF" />
    </com.google.android.material.appbar.AppBarLayout>

    <!-- Swipe Refresh & Article list container -->
    <androidx.swiperefreshlayout.widget.SwipeRefreshLayout
        android:id="@+id/swipe_refresh"
        android:layout_width="0dp"
        android:layout_height="0dp"
        app:layout_constraintBottom_toBottomOf="parent"
        app:layout_constraintEnd_toEndOf="parent"
        app:layout_constraintStart_toStartOf="parent"
        app:layout_constraintTop_toBottomOf="@+id/app_bar">

        <androidx.core.widget.NestedScrollView
            android:layout_width="match_parent"
            android:layout_height="match_parent"
            android:fillViewport="true">

            <androidx.constraintlayout.widget.ConstraintLayout
                android:layout_width="match_parent"
                android:layout_height="wrap_content">

                <!-- Breaking News Banner -->
                <com.google.android.material.card.MaterialCardView
                    android:id="@+id/card_breaking"
                    android:layout_width="0dp"
                    android:layout_height="wrap_content"
                    android:layout_margin="12dp"
                    android:visibility="gone"
                    app:cardBackgroundColor="#FFE0E0"
                    app:cardCornerRadius="12dp"
                    app:cardElevation="2dp"
                    app:strokeColor="#FFCDD2"
                    app:strokeWidth="1dp"
                    app:layout_constraintEnd_toEndOf="parent"
                    app:layout_constraintStart_toStartOf="parent"
                    app:layout_constraintTop_toTopOf="parent">

                    <LinearLayout
                        android:layout_width="match_parent"
                        android:layout_height="wrap_content"
                        android:orientation="vertical"
                        android:padding="12dp">

                        <TextView
                            android:layout_width="wrap_content"
                            android:layout_height="wrap_content"
                            android:text="BREAKING DRUG APPROVAL"
                            android:textColor="#C62828"
                            android:textSize="11sp"
                            android:textStyle="bold" />

                        <TextView
                            android:id="@+id/txt_breaking_title"
                            android:layout_width="match_parent"
                            android:layout_height="wrap_content"
                            android:layout_marginTop="4dp"
                            android:textColor="#212121"
                            android:textSize="15sp"
                            android:textStyle="bold" />
                    </LinearLayout>
                </com.google.android.material.card.MaterialCardView>

                <!-- Articles List -->
                <androidx.recyclerview.widget.RecyclerView
                    android:id="@+id/recycler_articles"
                    android:layout_width="0dp"
                    android:layout_height="0dp"
                    android:paddingTop="8dp"
                    app:layout_constraintBottom_toBottomOf="parent"
                    app:layout_constraintEnd_toEndOf="parent"
                    app:layout_constraintStart_toStartOf="parent"
                    app:layout_constraintTop_toBottomOf="@+id/card_breaking" />

            </androidx.constraintlayout.widget.ConstraintLayout>
        </androidx.core.widget.NestedScrollView>
    </androidx.swiperefreshlayout.widget.SwipeRefreshLayout>

</androidx.constraintlayout.widget.ConstraintLayout>`
  },
  {
    name: "PharmaNewsApplication.kt",
    path: "/android/app/src/main/java/com/pharmanews/app/PharmaNewsApplication.kt",
    category: "Kotlin Arch",
    content: `package com.pharmanews.app

import android.app.Application
import dagger.hilt.android.HiltAndroidApp

@HiltAndroidApp
class PharmaNewsApplication : Application() {
    override fun onCreate() {
        super.onCreate()
    }
}`
  },
  {
    name: "Article.kt",
    path: "/android/app/src/main/java/com/pharmanews/app/domain/model/Article.kt",
    category: "Kotlin Arch",
    content: `package com.pharmanews.app.domain.model

data class Article(
    val id: String,
    val title: String,
    val summary: String,
    val content: String,
    val category: String,
    val source: String,
    val author: String,
    val date: String,
    val imageUrl: String,
    val readTime: String,
    val isBreaking: Boolean = false,
    val isFeatured: Boolean = false,
    val isBookmarked: Boolean = false
)`
  },
  {
    name: "BookmarkEntity.kt",
    path: "/android/app/src/main/java/com/pharmanews/app/data/database/entity/BookmarkEntity.kt",
    category: "Kotlin Arch",
    content: `package com.pharmanews.app.data.database.entity

import androidx.room.Entity
import androidx.room.PrimaryKey

@Entity(tableName = "bookmarks")
data class BookmarkEntity(
    @PrimaryKey val id: String,
    val title: String,
    val summary: String,
    val content: String,
    val category: String,
    val source: String,
    val author: String,
    val date: String,
    val imageUrl: String,
    val readTime: String,
    val isBreaking: Boolean,
    val isFeatured: Boolean,
    val savedAt: Long = System.currentTimeMillis()
)`
  },
  {
    name: "BookmarkDao.kt",
    path: "/android/app/src/main/java/com/pharmanews/app/data/database/dao/BookmarkDao.kt",
    category: "Kotlin Arch",
    content: `package com.pharmanews.app.data.database.dao

import androidx.room.*
import com.pharmanews.app.data.database.entity.BookmarkEntity
import kotlinx.coroutines.flow.Flow

@Dao
interface BookmarkDao {
    @Query("SELECT * FROM bookmarks ORDER BY savedAt DESC")
    fun getAllBookmarksFlow(): Flow<List<BookmarkEntity>>

    @Query("SELECT * FROM bookmarks WHERE id = :id LIMIT 1")
    suspend fun getBookmarkById(id: String): BookmarkEntity?

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertBookmark(bookmark: BookmarkEntity)

    @Query("DELETE FROM bookmarks WHERE id = :id")
    suspend fun deleteBookmarkById(id: String)

    @Query("SELECT EXISTS(SELECT 1 FROM bookmarks WHERE id = :id)")
    fun checkIsBookmarkedFlow(id: String): Flow<Boolean>
}`
  },
  {
    name: "NewsRepositoryImpl.kt",
    path: "/android/app/src/main/java/com/pharmanews/app/data/repository/NewsRepositoryImpl.kt",
    category: "Kotlin Arch",
    content: `package com.pharmanews.app.data.repository

import com.pharmanews.app.data.database.dao.ArticleCacheDao
import com.pharmanews.app.data.database.dao.BookmarkDao
import com.pharmanews.app.data.database.entity.BookmarkEntity
import com.pharmanews.app.data.database.entity.CachedArticleEntity
import com.pharmanews.app.data.network.PharmaNewsApi
import com.pharmanews.app.data.network.dto.toDomain
import com.pharmanews.app.domain.model.Article
import com.pharmanews.app.domain.repository.NewsRepository
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.combine
import kotlinx.coroutines.flow.map
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class NewsRepositoryImpl @Inject constructor(
    private val api: PharmaNewsApi,
    private val cacheDao: ArticleCacheDao,
    private val bookmarkDao: BookmarkDao
) : NewsRepository {

    override fun getArticlesFlow(category: String): Flow<List<Article>> {
        val cacheFlow = if (category == "All News" || category == "All") {
            cacheDao.getAllCachedArticlesFlow()
        } else {
            cacheDao.getCachedArticlesByCategoryFlow(category)
        }.map { list -> list.map { it.toDomain() } }

        val bookmarksFlow = bookmarkDao.getAllBookmarksFlow()

        return cacheFlow.combine(bookmarksFlow) { cachedList, bookmarkedList ->
            val bookmarkedIds = bookmarkedList.map { it.id }.toSet()
            cachedList.map { article ->
                article.copy(isBookmarked = bookmarkedIds.contains(article.id))
            }
        }
    }

    override fun getBookmarksFlow(): Flow<List<Article>> = bookmarkDao.getAllBookmarksFlow().map { list -> list.map { it.toDomain() } }
    override fun checkIsBookmarkedFlow(id: String): Flow<Boolean> = bookmarkDao.checkIsBookmarkedFlow(id)

    override suspend fun refreshArticles(category: String) {
        try {
            val listDto = if (category == "All News" || category == "All") {
                api.getTopHeadlines()
            } else {
                api.getArticlesByCategory(category)
            }
            val cacheEntities = listDto.map { dto ->
                CachedArticleEntity(
                    id = dto.id, title = dto.title, summary = dto.summary,
                    content = dto.content, category = dto.category, source = dto.source,
                    author = dto.author, date = dto.date, imageUrl = dto.imageUrl,
                    readTime = dto.readTime, isBreaking = dto.isBreaking ?: false, isFeatured = dto.isFeatured ?: false
                )
            }
            if (cacheEntities.isNotEmpty()) {
                if (category == "All News" || category == "All") cacheDao.clearArticleCache()
                cacheDao.insertArticles(cacheEntities)
            }
        } catch (e: Exception) {
            throw e
        }
    }

    override suspend fun searchArticles(query: String): List<Article> = api.searchArticles(query).map { it.toDomain() }
    override suspend fun getArticleById(id: String): Article? {
        val bookmarked = bookmarkDao.getBookmarkById(id)
        if (bookmarked != null) return bookmarked.toDomain()
        return try { api.getArticleById(id).toDomain() } catch (e: Exception) { null }
    }

    override suspend fun addBookmark(article: Article) {
        bookmarkDao.insertBookmark(BookmarkEntity(
            id = article.id, title = article.title, summary = article.summary,
            content = article.content, category = article.category, source = article.source,
            author = article.author, date = article.date, imageUrl = article.imageUrl,
            readTime = article.readTime, isBreaking = article.isBreaking, isFeatured = article.isFeatured
        ))
    }

    override suspend fun removeBookmark(id: String) = bookmarkDao.deleteBookmarkById(id)
}`
  },
  {
    name: "DatabaseModule.kt",
    path: "/android/app/src/main/java/com/pharmanews/app/di/DatabaseModule.kt",
    category: "Kotlin Arch",
    content: `package com.pharmanews.app.di

import android.content.Context
import androidx.room.Room
import com.pharmanews.app.data.database.PharmaNewsDatabase
import com.pharmanews.app.data.database.dao.ArticleCacheDao
import com.pharmanews.app.data.database.dao.BookmarkDao
import dagger.Module
import dagger.Provides
import dagger.hilt.InstallIn
import dagger.hilt.android.qualifiers.ApplicationContext
import dagger.hilt.components.SingletonComponent
import javax.inject.Singleton

@Module
@InstallIn(SingletonComponent::class)
object DatabaseModule {

    @Provides
    @Singleton
    fun provideDatabase(
        @ApplicationContext context: Context
    ): PharmaNewsDatabase {
        return Room.databaseBuilder(
            context,
            PharmaNewsDatabase::class.java,
            "pharmanews.db"
        ).fallbackToDestructiveMigration().build()
    }

    @Provides
    fun provideBookmarkDao(db: PharmaNewsDatabase): BookmarkDao = db.bookmarkDao()

    @Provides
    fun provideArticleCacheDao(db: PharmaNewsDatabase): ArticleCacheDao = db.articleCacheDao()
}`
  },
  {
    name: "HomeViewModel.kt",
    path: "/android/app/src/main/java/com/pharmanews/app/presentation/home/HomeViewModel.kt",
    category: "Kotlin Arch",
    content: `package com.pharmanews.app.presentation.home

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.pharmanews.app.domain.model.Article
import com.pharmanews.app.domain.repository.NewsRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.ExperimentalCoroutinesApi
import kotlinx.coroutines.flow.*
import kotlinx.coroutines.launch
import javax.inject.Inject

sealed interface HomeUiState {
    object Loading : HomeUiState
    data class Success(val articles: List<Article>) : HomeUiState
    data class Error(val message: String) : HomeUiState
}

@OptIn(ExperimentalCoroutinesApi::class)
@HiltViewModel
class HomeViewModel @Inject constructor(
    private val repository: NewsRepository
) : ViewModel() {

    private val _selectedCategory = MutableStateFlow("All News")
    val selectedCategory: StateFlow<String> = _selectedCategory.asStateFlow()

    private val _isRefreshing = MutableStateFlow(false)
    val isRefreshing: StateFlow<Boolean> = _isRefreshing.asStateFlow()

    val uiState: StateFlow<HomeUiState> = _selectedCategory
        .flatMapLatest { category ->
            repository.getArticlesFlow(category)
                .map { list -> HomeUiState.Success(list) }
                .catch { emit(HomeUiState.Error(it.localizedMessage ?: "Unknown Error occurred")) }
        }
        .stateIn(
            scope = viewModelScope,
            started = SharingStarted.WhileSubscribed(5000),
            initialValue = HomeUiState.Loading
        )

    init {
        refreshArticles()
    }

    fun selectCategory(category: String) {
        _selectedCategory.value = category
        refreshArticles()
    }

    fun refreshArticles() {
        viewModelScope.launch {
            _isRefreshing.value = true
            try { repository.refreshArticles(_selectedCategory.value) } catch (e: Exception) {}
            finally { _isRefreshing.value = false }
        }
    }
}`
  },
  {
    name: "PharmaNewsFcmService.kt",
    path: "/android/app/src/main/java/com/pharmanews/app/service/PharmaNewsFcmService.kt",
    category: "Kotlin Arch",
    content: `package com.pharmanews.app.service

import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.media.RingtoneManager
import android.os.Build
import androidx.core.app.NotificationCompat
import com.google.firebase.messaging.FirebaseMessagingService
import com.google.firebase.messaging.RemoteMessage
import com.pharmanews.app.presentation.MainActivity

class PharmaNewsFcmService : FirebaseMessagingService() {

    override fun onMessageReceived(remoteMessage: RemoteMessage) {
        remoteMessage.notification?.let {
            sendNotification(it.title ?: "PharmaNews Breakout", it.body ?: "")
        }
    }

    private fun sendNotification(title: String, messageBody: String) {
        val intent = Intent(this, MainActivity::class.java).apply {
            addFlags(Intent.FLAG_ACTIVITY_CLEAR_TOP)
        }
        val pendingIntent = PendingIntent.getActivity(
            this, 0, intent,
            PendingIntent.FLAG_ONE_SHOT or PendingIntent.FLAG_IMMUTABLE
        )

        val channelId = "pharmanews_approvals_channel"
        val defaultSoundUri = RingtoneManager.getDefaultUri(RingtoneManager.TYPE_NOTIFICATION)
        
        val notificationBuilder = NotificationCompat.Builder(this, channelId)
            .setSmallIcon(android.R.drawable.stat_notify_chat)
            .setContentTitle(title)
            .setContentText(messageBody)
            .setAutoCancel(true)
            .setSound(defaultSoundUri)
            .setContentIntent(pendingIntent)

        val notificationManager = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                channelId,
                "Pharmaceutical Approvals & Breakthroughs",
                NotificationManager.IMPORTANCE_DEFAULT
            )
            notificationManager.createNotificationChannel(channel)
        }

        notificationManager.notify(0, notificationBuilder.build())
    }
}`
  }
];
