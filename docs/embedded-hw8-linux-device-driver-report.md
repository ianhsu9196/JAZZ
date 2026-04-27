# Lab8：Linux Device Driver 實驗報告

## 基本資料

- 姓名：許禕恩
- 系級：資管碩一
- 實驗名稱：Linux Device Driver（Lab8）

## 一、實驗目的

- 了解 Linux Driver 的基本概念
- 學習如何撰寫與載入 kernel module
- 實作 character device driver 並進行測試
- 了解 user space 與 kernel space 的互動方式

## 二、實驗環境

- Ubuntu（開發環境）
- Raspberry Pi 3（執行環境）
- Buildroot toolchain（cross compile）
- UART（連接 Raspberry Pi）
- USB（傳輸檔案）

## 三、實驗步驟

### 1. 撰寫 Hello Driver

建立 `hello.c`：

```c
#include <linux/init.h>
#include <linux/module.h>
#include <linux/kernel.h>

MODULE_LICENSE("Dual BSD/GPL");

static int demo_init(void) {
    printk("<1>I am the initial function!\n");
    return 0;
}

static void demo_exit(void) {
    printk("<1>I am the exit function!\n");
}

module_init(demo_init);
module_exit(demo_exit);
```

### 2. 編譯 Module

執行：

```bash
make
```

產生：

```text
hello.ko
```

### 3. 測試 Module

執行：

```bash
insmod hello.ko
dmesg | tail
rmmod hello
```

### 4. 撰寫完整 Driver

完整的 character device driver 需包含以下操作：

- `open`
- `read`
- `write`
- `ioctl`
- `release`

透過 `file_operations` 進行連接：

```c
struct file_operations drv_fops = {
    .read = drv_read,
    .write = drv_write,
    .unlocked_ioctl = drv_ioctl,
    .open = drv_open,
    .release = drv_release,
};
```

### 5. 註冊 Driver

使用 `register_chrdev` 註冊 character device driver：

```c
register_chrdev(MAJOR_NUM, "demo", &drv_fops);
```

### 6. Cross Compile

執行：

```bash
make ARCH=arm64 CROSS_COMPILE=...
```

產生：

```text
driver.ko
```

### 7. 傳到 Raspberry Pi

使用 USB 傳輸 `.ko` 檔案，範例如下：

```bash
mount /dev/sda1 /mnt/usb
```

### 8. 載入 Driver

```bash
insmod /mnt/usb/driver.ko
```

### 9. 建立裝置節點

```bash
mknod /dev/demo c 60 0
```

### 10. 測試 Driver

方法一：使用 shell

```bash
echo hello > /dev/demo
```

方法二：使用 `test.c`

```c
int fd = open("/dev/demo", O_RDWR);
read(fd, buf, sizeof(buf));
write(fd, buf, sizeof(buf));
close(fd);
```

## 四、實驗結果

成功在 `dmesg` 中看到以下訊息：

```text
DEMO: started
device open
device read
device write
device close
```

這表示：

- driver 成功載入
- user space 成功呼叫 driver
- `file_operations` 正常運作

## 五、問題與回答

### 1. `MODULE_LICENSE()`

用來宣告 module 的授權方式。若未宣告，kernel 可能會產生 warning。

### 2. `MODULE_DESCRIPTION()`

用來描述 driver 功能，可透過 `modinfo` 查看。

### 3. `MODULE_AUTHOR()`

用來標示 driver 的作者資訊。

## 六、實驗困難與解決方法

### 問題 1：`vim` 無法使用

錯誤現象：

```text
vim: command not found
```

解決方式：

- 改用 `nano`
- 或安裝 `vim`

### 問題 2：Makefile 路徑錯誤

問題原因：

kernel path 設定錯誤，導致 compile 失敗。

解決方式：

修正為正確的 kernel source path。

### 問題 3：Raspberry Pi 無網路

問題現象：

```text
NO-CARRIER
```

解決方式：

改用 USB 傳輸 `driver.ko`。

### 問題 4：`test.exe` 無法開啟 device

錯誤現象：

```text
cannot open device
```

原因：

尚未建立 `/dev/demo`。

解決方式：

```bash
mknod /dev/demo c 60 0
```

### 問題 5：權限問題

錯誤現象：

```text
Permission denied
```

解決方式：

```bash
sudo sh -c "echo hello > /dev/demo"
```

### 問題 6：忘記 `insmod`

問題原因：

driver 尚未載入，導致測試失敗。

解決方式：

```bash
insmod driver.ko
```

## 七、實驗心得

本實驗讓我了解 Linux driver 的基本架構與運作方式。透過撰寫 kernel module 並實作 character device driver，學習到 user space 如何透過系統呼叫與 driver 溝通。

此外，也學會使用 cross compile 及在 Raspberry Pi 上進行測試，並透過 `dmesg` 觀察 kernel log 來除錯。

## 八、結論

本實驗成功完成 Linux Device Driver 的開發與測試，並驗證 driver 可透過 `/dev/demo` 與 user space 溝通。

透過此實驗，對 kernel module 與 driver 架構有更深入的理解。
