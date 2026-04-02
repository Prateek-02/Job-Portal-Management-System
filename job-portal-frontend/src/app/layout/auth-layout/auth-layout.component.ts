import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-auth-layout',
  standalone: true,
  imports: [RouterOutlet],
  template: `
    <div class="min-h-screen flex flex-col lg:flex-row relative z-10 w-full">

      <!-- ── LEFT PANEL — Details & Branding ───────────────────────── -->
      <div class="relative hidden lg:flex lg:w-5/12 xl:w-1/2 flex-col justify-between overflow-hidden border-r border-white/40"
           style="background: rgba(255, 255, 255, 0.4); backdrop-filter: blur(40px); -webkit-backdrop-filter: blur(40px);">

        <!-- Subtle overlay gradient to pop text -->
        <div class="absolute inset-0 bg-gradient-to-br from-white/60 to-transparent pointer-events-none"></div>

        <!-- Content -->
        <div class="relative z-10 flex flex-col flex-1 px-12 xl:px-20 py-16 justify-center">

          <!-- Logo -->
          <div class="flex items-center gap-3 mb-16">
            <div class="w-10 h-10 rounded-xl flex items-center justify-center shadow-lg"
                 style="background: linear-gradient(135deg, #FF9A9E, #A18CD1);">
              <svg class="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5"
                      d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
              </svg>
            </div>
            <span class="text-[#1A1A1A] font-extrabold text-2xl tracking-tight">JobPortal</span>
          </div>

          <!-- Headline -->
          <div class="mb-14">
            <h1 class="text-4xl xl:text-[46px] font-extrabold text-[#1A1A1A] leading-tight mb-5 tracking-tight">
              Start your next big<br/>
              <span style="background: linear-gradient(90deg, #A18CD1, #667eea); -webkit-background-clip: text; background-clip: text; -webkit-text-fill-color: transparent; color: transparent;">
                career leap.
              </span>
            </h1>
            <p class="text-[#4A4A4A] text-lg font-medium leading-relaxed max-w-md">
              Connect with top recruiters, discover opportunities tailored to your skills, and land your dream job — all in one place.
            </p>
          </div>

          <!-- Feature bullets -->
          <div class="space-y-6 mb-14">
            <div class="flex items-start gap-4">
              <div class="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm border border-white/60 bg-white/50">
                <svg class="w-5 h-5 text-[#A18CD1]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
                </svg>
              </div>
              <div>
                <p class="text-[#1A1A1A] font-bold text-[15px]">Smart Job Discovery</p>
                <p class="text-[#4A4A4A] text-sm mt-0.5 font-medium">Filter by salary, location, experience & more</p>
              </div>
            </div>
            <div class="flex items-start gap-4">
              <div class="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm border border-white/60 bg-white/50">
                <svg class="w-5 h-5 text-[#FF9A9E]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"/>
                </svg>
              </div>
              <div>
                <p class="text-[#1A1A1A] font-bold text-[15px]">Real-Time Application Tracking</p>
                <p class="text-[#4A4A4A] text-sm mt-0.5 font-medium">Know exactly where your application stands</p>
              </div>
            </div>
            <div class="flex items-start gap-4">
              <div class="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm border border-white/60 bg-white/50">
                <svg class="w-5 h-5 text-[#667eea]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"/>
                </svg>
              </div>
              <div>
                <p class="text-[#1A1A1A] font-bold text-[15px]">Instant Notifications</p>
                <p class="text-[#4A4A4A] text-sm mt-0.5 font-medium">Get email alerts on every status update</p>
              </div>
            </div>
          </div>

        </div>

        <!-- Bottom credit -->
        <div class="relative z-10 px-12 xl:px-20 pb-8">
          <p class="text-[#4A4A4A] text-xs font-semibold">© 2026 JobPortal. All rights reserved.</p>
        </div>
      </div>

      <!-- ── RIGHT PANEL — Form ──────────────────────────── -->
      <div class="flex-1 flex flex-col justify-center items-center px-6 py-12 lg:px-12 xl:px-16 relative w-full">

        <!-- Mobile logo (visible only on small screens) -->
        <div class="flex items-center gap-3 mb-10 lg:hidden animate-fade-in-up">
          <div class="w-10 h-10 rounded-xl flex items-center justify-center shadow-md border border-white/60"
               style="background: linear-gradient(135deg, #FF9A9E, #A18CD1);">
            <svg class="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5"
                    d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
            </svg>
          </div>
          <span class="text-[#1A1A1A] font-extrabold text-2xl tracking-tight">JobPortal</span>
        </div>

        <!-- The login/signup card -->
        <div class="w-full max-w-md animate-fade-in-up relative z-10">
          <router-outlet />
        </div>
      </div>
    </div>
  `
})
export class AuthLayoutComponent {}

