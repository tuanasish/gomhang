# Plan: Auto Shift Creation (Tự mở ca làm việc)
Created: 260306-0026
Status: 🟡 In Progress

## Overview
Làm lại luồng Mở Ca (Shift) cho nhân viên. 
Thay vì bắt buộc admin cấp vốn hoặc nhân viên phải nhập số tiền khởi tạo ca, nhân viên chỉ cần bấm nút "Bắt đầu làm việc". Hệ thống sẽ tự tạo một ca với `tienVon = 0`. Các giao dịch trả lại tiền thừa (thối tiền) được phép làm cho quỹ tiền mặt âm. Cuối ngày đối soát dựa trên chênh lệch tổng để biết được nhân viên đó đang âm hay dương bao nhiêu tiền.

## Tech Stack
- Frontend: React Native (Màn hình ShiftScreen, CreateOrderScreen)
- Backend: Node.js/Express (API Shifts, Orders)
- Database: Supabase (Bảng shifts)

## Phases

| Phase | Name | Status | Progress |
|-------|------|--------|----------|
| 01 | API & Logic Backend | ⬜ Pending | 0% |
| 02 | Frontend UI & Store | ⬜ Pending | 0% |
| 03 | Testing & Fix Bugs | ⬜ Pending | 0% |

## Quick Commands
- Start Phase 1: `/code phase-01`
- Next steps: `/next`
- Save context: `/save-brain`
