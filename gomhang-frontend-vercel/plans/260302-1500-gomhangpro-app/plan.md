# Plan: Gomhangpro App Nội Bộ (TestFlight)
Created: 2026-03-02
Status: 🟡 In Progress

## Overview
Dự án xây dựng App Mobile đa nền tảng cho nhân viên nội bộ của gomhangpro sử dụng. App có đầy đủ tính năng 100% y hệt website. Phân phối nội bộ qua TestFlight (iOS).

## Tech Stack (Đề xuất)
- **Frontend App:** Expo / React Native (vì dễ kết nối logic nếu web dùng React/Next.js, code 1 lần chạy 2 nền tảng)
- **Backend/Database:** Sử dụng chung hoàn toàn với website hiện tại.
- **UI Framework:** Tuỳ chọn (NativeWind / Tamagui / hoặc custom stylesheet clone y hệt web).

## Phases

| Phase | Name | Status | Progress |
|-------|------|--------|----------|
| 01 | Setup Environment | ✅ Complete | 100% |
| 02 | Authentication & Core Sync | ✅ Complete | 100% |
| 03 | UI Components (Clone Web) | ✅ Complete | 100% |
| 04 | Screens & Navigation | ✅ Complete | 100% |
| 05 | Worker Features (StartShift, OrderDetail, History)| ✅ Complete| 100% |
| 06 | Manager Features (Admin, Counters, Staff) | ✅ Complete | 100% |
| 07 | Data Binding & API Integration | ✅ Complete | 100% |
| 08 | Testing & TestFlight Build | 🟡 In Progress | 0% |

## Quick Commands
- Chạy Design/Thiết kế chi tiết: `/design`
- Bắt đầu Phase 1: `/code phase-01`
- Kiểm tra tiến độ: `/next`
