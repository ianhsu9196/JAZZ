# Lab7：System Call Implementation 實驗報告

## 一、實驗目的

本實驗的目的是學習 Linux Kernel 中 System Call 的實作方式，並透過 user space 程式呼叫自訂的 system call，最後使用 `dmesg` 驗證 kernel 是否成功執行。

## 二、實驗環境

- Ubuntu（VirtualBox）
- Buildroot
- Raspberry Pi 3 Model B
- USB 隨身碟（用於傳輸 `test.exe`）

## 三、實驗原理

### 1. System Call

System Call 是 user space 與 kernel space 溝通的橋樑，讓使用者程式可以透過標準介面請求核心服務。

### 2. `printk` 與 `printf` 的差異

- `printf`：用於 user space
- `printk`：用於 kernel space，輸出內容需透過 `dmesg` 查看

### 3. `dmesg`

`dmesg` 用來查看 kernel log，可用來驗證自訂 system call 是否已成功執行。

## 四、實作步驟

### 1. 新增 System Call

- 在 `syscall.tbl` 中加入 `mysys` 的 system call 編號
- 在 `unistd.h` 中定義對應的 syscall 編號

### 2. 修改 Kernel

在 kernel 中加入自訂的 system call 實作：

```c
asmlinkage long sys_mysys(void) {
    printk("Hello, I am System Call!\n");
    return 0;
}
```

### 3. 編譯 `test.c`

建立 user space 測試程式：

```c
#include <unistd.h>
#include <sys/syscall.h>
#include <stdio.h>

#define __NR_mysyscall 451

int main() {
    syscall(__NR_mysyscall);
    return 0;
}
```

使用 cross compiler 進行編譯：

```bash
aarch64-linux-gcc -static test.c -o test.exe
```

### 4. 燒錄 Image 至 SD 卡

將 Buildroot 產生的 Image 燒錄到 SD 卡中，並插入 Raspberry Pi。

### 5. 使用 USB 傳輸 `test.exe`

將編譯完成的 `test.exe` 複製到 USB 隨身碟，再插入 Raspberry Pi 進行測試。

## 五、Demo 操作流程

### Step 1：插入 USB 並確認裝置

```bash
dmesg | tail
```

確認有類似以下訊息：

```text
sdb: sdb1
```

### Step 2：Mount USB

```bash
mkdir -p /mnt/usb
mount -t vfat /dev/sdb1 /mnt/usb
ls /mnt/usb
```

### Step 3：複製執行檔

```bash
cp /mnt/usb/test.exe /
```

### Step 4：給予執行權限

```bash
chmod +x /test.exe
```

### Step 5：執行程式

```bash
/test.exe
```

### Step 6：查看 Kernel 訊息

```bash
dmesg | tail
```

預期輸出如下：

```text
Hello, I am System Call! ID: xxxxx
```

## 六、實驗結果

本實驗成功透過 user program 呼叫自訂 system call，並在 kernel 中使用 `printk` 輸出訊息，最後透過 `dmesg` 成功觀察到執行結果，證明 system call 已正確實作並運作。

## 七、遇到問題與解決方法

### 問題 1：`test.exe` 無法執行

錯誤訊息：

```text
-sh: ./test.exe: not found
```

原因：

未使用 cross compile，導致產生的執行檔架構不符合 Raspberry Pi 環境。

解法：

使用 `aarch64-linux-gcc` 重新編譯程式。

### 問題 2：USB 無法 mount

錯誤現象：

```text
Can't open blockdev
```

原因：

裝置名稱判斷錯誤，未確認實際掛載裝置。

解法：

先使用 `dmesg` 確認 USB 對應的裝置名稱為 `/dev/sdb1`。

### 問題 3：`cp` 指令錯誤

錯誤寫法：

```bash
cp /mnt/usb/test.exe
```

正確寫法：

```bash
cp /mnt/usb/test.exe /
```

原因：

少寫目的路徑，導致 `cp` 指令語法不完整。

### 問題 4：Kernel 沒有輸出

原因：

- 沒有使用 `printk`
- kernel 尚未更新為新的編譯版本

解法：

重新編譯 kernel 並重新燒錄到開發板上。

## 八、老師可能提問與回答

### Q1：System Call 是什麼？

System Call 是 user space 與 kernel space 溝通的介面，讓使用者程式可以向作業系統核心請求服務。

### Q2：為什麼要用 `dmesg`？

因為 kernel 中使用的是 `printk` 輸出訊息，不會直接顯示在一般 user program 的終端畫面上，所以必須透過 `dmesg` 查看 kernel log。

### Q3：`printf` 跟 `printk` 差在哪？

- `printf` 用於 user space
- `printk` 用於 kernel space

### Q4：為什麼 `test.exe` 沒有直接輸出？

因為真正的輸出是在 kernel 端透過 `printk` 產生，所以 user program 本身不一定會在終端機顯示內容。

### Q5：整個流程是什麼？

```text
user program -> syscall -> kernel -> printk -> dmesg
```

## 九、結論

本實驗成功完成自訂 System Call 的實作，並透過 `test.exe` 呼叫 kernel 中新增的 system call 函式，最後使用 `dmesg` 驗證執行結果。透過本次實驗，可以更清楚理解 user space 與 kernel space 之間的互動流程，以及 Linux Kernel 中 system call 的基本實作方式。
